package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
	"github.com/movie-matcher/backend/internal/services"
	"gorm.io/gorm"
)

func applyTitleReactionToUpdate(up map[string]interface{}, req *models.UpdateListRequest) error {
	if req.TitleReaction == nil {
		return nil
	}
	if *req.TitleReaction == "" {
		up["title_reaction"] = nil
		return nil
	}
	if !models.ValidTitleReaction(*req.TitleReaction) {
		return errors.New("invalid title reaction")
	}
	up["title_reaction"] = models.TitleReaction(*req.TitleReaction)
	return nil
}

func titleReactionFromRequest(req *models.AddToListRequest) *models.TitleReaction {
	if req.TitleReaction == nil || *req.TitleReaction == "" || !models.ValidTitleReaction(*req.TitleReaction) {
		return nil
	}
	t := models.TitleReaction(*req.TitleReaction)
	return &t
}

type ListSpec struct {
	TypeKey    string // ключ в URL: "movies", "anime", "games", ...
	EntityType string // для list stats: models.ListEntityMovie, ...
	Name       string // для сообщений: "Movie", "Anime", ...
	EntityExists func(db *gorm.DB, entityID uint) error
	FindLists func(db *gorm.DB, userID interface{}, status string) (interface{}, error)
	FindOne func(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error)
	Create func(db *gorm.DB, userID uint, entityID uint, req models.AddToListRequest) (interface{}, error)
	ApplyUpdate func(db *gorm.DB, list interface{}, req models.UpdateListRequest) (oldStatus models.ListStatus, err error)
	GetStatus func(list interface{}) models.ListStatus
	Delete func(db *gorm.DB, list interface{}) error
	PreloadAfter func(db *gorm.DB, list interface{}) error
}

var listSpecs map[string]*ListSpec
var now = func() *time.Time { t := time.Now(); return &t }

func isCurrentStatus(s models.ListStatus) bool {
	return s == models.ListStatusWatching || s == models.ListStatusRewatching
}

func init() {
	listSpecs = map[string]*ListSpec{
		"movies": {
			TypeKey: "movies", EntityType: models.ListEntityMovie, Name: "Movie",
			EntityExists: func(db *gorm.DB, entityID uint) error { return db.First(&models.Movie{}, entityID).Error },
			FindLists: func(db *gorm.DB, userID interface{}, status string) (interface{}, error) {
				var out []models.MovieList
				q := db.Where("user_id = ?", userID).Preload("Movie.Genres")
				if status != "" {
					q = q.Where("status = ?", status)
				}
				return &out, q.Find(&out).Error
			},
			FindOne: func(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
				var l models.MovieList
				err := db.Where("user_id = ? AND movie_id = ?", userID, entityID).First(&l).Error
				return &l, err
			},
			Create: func(db *gorm.DB, userID uint, entityID uint, req models.AddToListRequest) (interface{}, error) {
				l := models.MovieList{UserID: userID, MovieID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req)}
				if isCurrentStatus(req.Status) {
					l.StartedAt = now()
					if req.Status == models.ListStatusRewatching {
						l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
					}
				} else if req.Status == models.ListStatusCompleted {
					l.CompletedAt = now()
				}
				if err := db.Create(&l).Error; err != nil {
					return nil, err
				}
				return &l, nil
			},
			ApplyUpdate: func(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
				l := list.(*models.MovieList)
				old := l.Status
				up := map[string]interface{}{}
				if req.Status != nil {
					newStatus := *req.Status
					up["status"] = newStatus

					if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
						sessions := l.RewatchSessions
						hasOpen := false
						for _, s := range sessions {
							if s.CompletedAt == nil {
								hasOpen = true
								break
							}
						}
						if !hasOpen {
							sessions = append(sessions, models.RewatchSession{StartedAt: now()})
							up["rewatch_sessions"] = sessions
						}
					} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
						sessions := l.RewatchSessions
						for i := len(sessions) - 1; i >= 0; i-- {
							if sessions[i].CompletedAt == nil {
								sessions[i].CompletedAt = now()
								up["rewatch_sessions"] = sessions
								break
							}
						}
					}

					if isCurrentStatus(*req.Status) && old == models.ListStatusPlanned && l.StartedAt == nil {
						up["started_at"] = now()
					} else if *req.Status == models.ListStatusCompleted && old != models.ListStatusCompleted {
						up["completed_at"] = now()
					}
				}
				if req.MarkRewatched != nil && *req.MarkRewatched {
					sessions := l.RewatchSessions
					sessions = append(sessions, models.RewatchSession{StartedAt: now(), CompletedAt: now()})
					up["rewatch_sessions"] = sessions
					up["completed_at"] = now()
				}
				if req.Comment != nil {
					up["comment"] = *req.Comment
				}
				if req.Rating != nil {
					up["rating"] = *req.Rating
				}
				if err := applyTitleReactionToUpdate(up, &req); err != nil {
					return "", err
				}
				if len(up) > 0 {
					if err := db.Model(l).Updates(up).Error; err != nil {
						return "", err
					}
				}
				return old, nil
			},
			GetStatus: func(list interface{}) models.ListStatus { return list.(*models.MovieList).Status },
			Delete:    func(db *gorm.DB, list interface{}) error { return db.Delete(list).Error },
			PreloadAfter: func(db *gorm.DB, list interface{}) error {
				return db.Preload("Movie.Genres").First(list).Error
			},
		},
		"anime": {
			TypeKey: "anime", EntityType: models.ListEntityAnimeSeries, Name: "Anime",
			EntityExists: func(db *gorm.DB, entityID uint) error { return db.First(&models.AnimeSeries{}, entityID).Error },
			FindLists: func(db *gorm.DB, userID interface{}, status string) (interface{}, error) {
				var out []models.AnimeSeriesList
				q := db.Where("user_id = ?", userID).Preload("AnimeSeries.Genres")
				if status != "" {
					q = q.Where("status = ?", status)
				}
				return &out, q.Find(&out).Error
			},
			FindOne: func(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
				var l models.AnimeSeriesList
				err := db.Where("user_id = ? AND anime_series_id = ?", userID, entityID).First(&l).Error
				return &l, err
			},
			Create: func(db *gorm.DB, userID uint, entityID uint, req models.AddToListRequest) (interface{}, error) {
				l := models.AnimeSeriesList{
					UserID: userID, AnimeSeriesID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req),
					CurrentEpisode: req.CurrentEpisode, CurrentProgress: req.CurrentProgress,
				}
				if isCurrentStatus(req.Status) {
					l.StartedAt = now()
					if req.Status == models.ListStatusRewatching {
						l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
					}
				} else if req.Status == models.ListStatusCompleted {
					l.CompletedAt = now()
				}
				if err := db.Create(&l).Error; err != nil {
					return nil, err
				}
				return &l, nil
			},
			ApplyUpdate: func(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
				l := list.(*models.AnimeSeriesList)
				old := l.Status
				up := map[string]interface{}{}
				if req.Status != nil {
					newStatus := *req.Status
					up["status"] = newStatus

					if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
						sessions := l.RewatchSessions
						hasOpen := false
						for _, s := range sessions {
							if s.CompletedAt == nil {
								hasOpen = true
								break
							}
						}
						if !hasOpen {
							sessions = append(sessions, models.RewatchSession{StartedAt: now()})
							up["rewatch_sessions"] = sessions
						}
					} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
						sessions := l.RewatchSessions
						for i := len(sessions) - 1; i >= 0; i-- {
							if sessions[i].CompletedAt == nil {
								sessions[i].CompletedAt = now()
								up["rewatch_sessions"] = sessions
								break
							}
						}
					}

					if isCurrentStatus(*req.Status) && old == models.ListStatusPlanned && l.StartedAt == nil {
						up["started_at"] = now()
					} else if *req.Status == models.ListStatusCompleted && old != models.ListStatusCompleted {
						up["completed_at"] = now()
					}
				}
				if req.Comment != nil {
					up["comment"] = *req.Comment
				}
				if req.CurrentEpisode != nil {
					up["current_episode"] = *req.CurrentEpisode
				}
				if req.CurrentProgress != nil {
					up["current_progress"] = *req.CurrentProgress
				}
				if req.Rating != nil {
					up["rating"] = *req.Rating
				}
				if err := applyTitleReactionToUpdate(up, &req); err != nil {
					return "", err
				}
				if len(up) > 0 {
					if err := db.Model(l).Updates(up).Error; err != nil {
						return "", err
					}
				}
				return old, nil
			},
			GetStatus:   func(list interface{}) models.ListStatus { return list.(*models.AnimeSeriesList).Status },
			Delete:      func(db *gorm.DB, list interface{}) error { return db.Delete(list).Error },
			PreloadAfter: func(db *gorm.DB, list interface{}) error {
				return db.Preload("AnimeSeries.Genres").First(list).Error
			},
		},
		"games":          listSpecWithUpdate("games", models.ListEntityGame, "Game", func() interface{} { return &[]models.GameList{} }, "Game.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.Game{}, id).Error }, gameListBuild, gameListFindOne, gameListStatus, gameListApplyUpdate),
		"manga":          listSpecWithUpdate("manga", models.ListEntityManga, "Manga", func() interface{} { return &[]models.MangaList{} }, "Manga.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.Manga{}, id).Error }, mangaListBuild, mangaListFindOne, mangaListStatus, mangaListApplyUpdate),
		"books":          listSpecWithUpdate("books", models.ListEntityBook, "Book", func() interface{} { return &[]models.BookList{} }, "Book.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.Book{}, id).Error }, bookListBuild, bookListFindOne, bookListStatus, bookListApplyUpdate),
		"light-novels":   listSpecWithUpdate("light-novels", models.ListEntityLightNovel, "Light novel", func() interface{} { return &[]models.LightNovelList{} }, "LightNovel.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.LightNovel{}, id).Error }, lightNovelListBuild, lightNovelListFindOne, lightNovelListStatus, lightNovelListApplyUpdate),
		"tv-series":      listSpecWithUpdate("tv-series", models.ListEntityTVSeries, "TV series", func() interface{} { return &[]models.TVSeriesList{} }, "TVSeries.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.TVSeries{}, id).Error }, tvSeriesListBuild, tvSeriesListFindOne, tvSeriesListStatus, tvSeriesListApplyUpdate),
		"cartoon-series": listSpecWithUpdate("cartoon-series", models.ListEntityCartoonSeries, "Cartoon series", func() interface{} { return &[]models.CartoonSeriesList{} }, "CartoonSeries.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.CartoonSeries{}, id).Error }, cartoonSeriesListBuild, cartoonSeriesListFindOne, cartoonSeriesListStatus, cartoonSeriesListApplyUpdate),
		"cartoon-movies":  listSpecWithUpdate("cartoon-movies", models.ListEntityCartoonMovie, "Cartoon movie", func() interface{} { return &[]models.CartoonMovieList{} }, "CartoonMovie.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.CartoonMovie{}, id).Error }, cartoonMovieListBuild, cartoonMovieListFindOne, cartoonMovieListStatus, cartoonMovieListApplyUpdate),
		"anime-movies":    listSpecWithUpdate("anime-movies", models.ListEntityAnimeMovie, "Anime movie", func() interface{} { return &[]models.AnimeMovieList{} }, "AnimeMovie.Genres", func(db *gorm.DB, id uint) error { return db.First(&models.AnimeMovie{}, id).Error }, animeMovieListBuild, animeMovieListFindOne, animeMovieListStatus, animeMovieListApplyUpdate),
	}
}

func listSpecSimple(
	typeKey, entityType, name string,
	sliceFactory func() interface{},
	preload string,
	entityExists func(db *gorm.DB, entityID uint) error,
	buildList func(userID uint, entityID uint, req models.AddToListRequest) interface{},
	findOne func(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error),
	getStatus func(interface{}) models.ListStatus,
) *ListSpec {
	return listSpecWithUpdate(typeKey, entityType, name, sliceFactory, preload, entityExists, buildList, findOne, getStatus, nil)
}

func listSpecWithUpdate(
	typeKey, entityType, name string,
	sliceFactory func() interface{},
	preload string,
	entityExists func(db *gorm.DB, entityID uint) error,
	buildList func(userID uint, entityID uint, req models.AddToListRequest) interface{},
	findOne func(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error),
	getStatus func(interface{}) models.ListStatus,
	applyUpdate func(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error),
) *ListSpec {
	return &ListSpec{
		TypeKey: typeKey, EntityType: entityType, Name: name,
		EntityExists: entityExists,
		FindLists: func(db *gorm.DB, userID interface{}, status string) (interface{}, error) {
			sl := sliceFactory()
			q := db.Model(sl).Where("user_id = ?", userID).Preload(preload)
			if status != "" {
				q = q.Where("status = ?", status)
			}
			return sl, q.Find(sl).Error
		},
		FindOne:      findOne,
		Create: func(db *gorm.DB, userID uint, entityID uint, req models.AddToListRequest) (interface{}, error) {
			l := buildList(userID, entityID, req)
			if typeKey == "books" {
				if bookList, ok := l.(*models.BookList); ok {
					bookList.MaxPages = getBookMaxPages(db, entityID)
				}
			}
			return l, db.Create(l).Error
		},
		ApplyUpdate:  applyUpdate,
		GetStatus:    getStatus,
		Delete:       func(db *gorm.DB, list interface{}) error { return db.Delete(list).Error },
		PreloadAfter: func(db *gorm.DB, list interface{}) error { return db.Preload(preload).First(list).Error },
	}
}

func gameListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.GameList{UserID: userID, GameID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req)}
	if req.HoursPlayed != nil {
		m := int(*req.HoursPlayed * 60)
		l.TotalTime = &m
	}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func gameListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.GameList
	err := db.Where("user_id = ? AND game_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func gameListStatus(list interface{}) models.ListStatus { return list.(*models.GameList).Status }

func gameListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.GameList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(*req.Status) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if *req.Status == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if req.HoursPlayed != nil {
		m := int(*req.HoursPlayed * 60)
		up["total_time"] = m
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}

func mangaListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.MangaList{UserID: userID, MangaID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req), CurrentVolume: req.CurrentVolume, CurrentChapter: req.CurrentChapter}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func mangaListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.MangaList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(*req.Status) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if *req.Status == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if req.CurrentVolume != nil {
		up["current_volume"] = *req.CurrentVolume
	}
	if req.CurrentChapter != nil {
		up["current_chapter"] = *req.CurrentChapter
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func mangaListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.MangaList
	err := db.Where("user_id = ? AND manga_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func mangaListStatus(list interface{}) models.ListStatus { return list.(*models.MangaList).Status }

func getBookMaxPages(db *gorm.DB, bookID uint) *int {
	var book models.Book
	if err := db.Select("pages").First(&book, bookID).Error; err != nil {
		return nil
	}
	return book.Pages
}

func bookListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.BookList{UserID: userID, BookID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req), CurrentPage: req.CurrentPage}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func bookListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.BookList)
	old := l.Status
	up := map[string]interface{}{}
	up["max_pages"] = getBookMaxPages(db, l.BookID)
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(*req.Status) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if *req.Status == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if req.CurrentPage != nil {
		up["current_page"] = *req.CurrentPage
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func bookListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.BookList
	err := db.Where("user_id = ? AND book_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func bookListStatus(list interface{}) models.ListStatus { return list.(*models.BookList).Status }

func lightNovelListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.LightNovelList{UserID: userID, LightNovelID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req), CurrentVolumeNumber: req.CurrentVolumeNumber, CurrentChapterNumber: req.CurrentChapterNumber}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func lightNovelListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.LightNovelList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(newStatus) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if newStatus == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.MarkRewatched != nil && *req.MarkRewatched {
		sessions := l.RewatchSessions
		sessions = append(sessions, models.RewatchSession{StartedAt: now(), CompletedAt: now()})
		up["rewatch_sessions"] = sessions
		up["completed_at"] = now()
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if req.CurrentVolumeNumber != nil {
		up["current_volume_number"] = *req.CurrentVolumeNumber
	}
	if req.CurrentChapterNumber != nil {
		up["current_chapter_number"] = *req.CurrentChapterNumber
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func lightNovelListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.LightNovelList
	err := db.Where("user_id = ? AND light_novel_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func lightNovelListStatus(list interface{}) models.ListStatus { return list.(*models.LightNovelList).Status }

func tvSeriesListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.TVSeriesList{UserID: userID, TVSeriesID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req), CurrentEpisode: req.CurrentEpisode, CurrentProgress: req.CurrentProgress}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func tvSeriesListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.TVSeriesList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(newStatus) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if newStatus == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.MarkRewatched != nil && *req.MarkRewatched {
		sessions := l.RewatchSessions
		sessions = append(sessions, models.RewatchSession{StartedAt: now(), CompletedAt: now()})
		up["rewatch_sessions"] = sessions
		up["completed_at"] = now()
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if req.CurrentEpisode != nil {
		up["current_episode"] = *req.CurrentEpisode
	}
	if req.CurrentProgress != nil {
		up["current_progress"] = *req.CurrentProgress
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func tvSeriesListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.TVSeriesList
	err := db.Where("user_id = ? AND tv_series_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func tvSeriesListStatus(list interface{}) models.ListStatus { return list.(*models.TVSeriesList).Status }

func cartoonSeriesListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.CartoonSeriesList{UserID: userID, CartoonSeriesID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating, TitleReaction: titleReactionFromRequest(&req), CurrentEpisode: req.CurrentEpisode, CurrentProgress: req.CurrentProgress}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func cartoonSeriesListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.CartoonSeriesList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(newStatus) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if newStatus == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if req.CurrentEpisode != nil {
		up["current_episode"] = *req.CurrentEpisode
	}
	if req.CurrentProgress != nil {
		up["current_progress"] = *req.CurrentProgress
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func cartoonSeriesListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.CartoonSeriesList
	err := db.Where("user_id = ? AND cartoon_series_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func cartoonSeriesListStatus(list interface{}) models.ListStatus { return list.(*models.CartoonSeriesList).Status }

func cartoonMovieListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.CartoonMovieList{UserID: userID, CartoonMovieID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func cartoonMovieListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.CartoonMovieList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(newStatus) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if newStatus == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func cartoonMovieListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.CartoonMovieList
	err := db.Where("user_id = ? AND cartoon_movie_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func cartoonMovieListStatus(list interface{}) models.ListStatus { return list.(*models.CartoonMovieList).Status }

func animeMovieListBuild(userID uint, entityID uint, req models.AddToListRequest) interface{} {
	l := &models.AnimeMovieList{UserID: userID, AnimeMovieID: entityID, Status: req.Status, Comment: req.Comment, Rating: req.Rating}
	if isCurrentStatus(req.Status) {
		l.StartedAt = func() *time.Time { t := time.Now(); return &t }()
		if req.Status == models.ListStatusRewatching {
			l.RewatchSessions = []models.RewatchSession{{StartedAt: now()}}
		}
	} else if req.Status == models.ListStatusCompleted {
		l.CompletedAt = func() *time.Time { t := time.Now(); return &t }()
	}
	return l
}
func animeMovieListApplyUpdate(db *gorm.DB, list interface{}, req models.UpdateListRequest) (models.ListStatus, error) {
	l := list.(*models.AnimeMovieList)
	old := l.Status
	up := map[string]interface{}{}
	if req.Status != nil {
		newStatus := *req.Status
		up["status"] = newStatus

		if newStatus == models.ListStatusRewatching && old == models.ListStatusCompleted {
			sessions := l.RewatchSessions
			hasOpen := false
			for _, s := range sessions {
				if s.CompletedAt == nil {
					hasOpen = true
					break
				}
			}
			if !hasOpen {
				sessions = append(sessions, models.RewatchSession{StartedAt: now()})
				up["rewatch_sessions"] = sessions
			}
		} else if newStatus == models.ListStatusCompleted && old == models.ListStatusRewatching {
			sessions := l.RewatchSessions
			for i := len(sessions) - 1; i >= 0; i-- {
				if sessions[i].CompletedAt == nil {
					sessions[i].CompletedAt = now()
					up["rewatch_sessions"] = sessions
					break
				}
			}
		}

		if isCurrentStatus(newStatus) && old == models.ListStatusPlanned && l.StartedAt == nil {
			up["started_at"] = now()
		} else if newStatus == models.ListStatusCompleted && old != models.ListStatusCompleted {
			up["completed_at"] = now()
		}
	}
	if req.Comment != nil {
		up["comment"] = *req.Comment
	}
	if req.Rating != nil {
		up["rating"] = *req.Rating
	}
	if err := applyTitleReactionToUpdate(up, &req); err != nil {
		return "", err
	}
	if len(up) > 0 {
		if err := db.Model(l).Updates(up).Error; err != nil {
			return "", err
		}
	}
	return old, nil
}
func animeMovieListFindOne(db *gorm.DB, userID interface{}, entityID uint) (interface{}, error) {
	var l models.AnimeMovieList
	err := db.Where("user_id = ? AND anime_movie_id = ?", userID, entityID).First(&l).Error
	return &l, err
}
func animeMovieListStatus(list interface{}) models.ListStatus { return list.(*models.AnimeMovieList).Status }

func GetListSpec(typeKey string) *ListSpec {
	return listSpecs[typeKey]
}

func snapshotListExtra(typeKey string, list interface{}) map[string]interface{} {
	if list == nil {
		return nil
	}
	out := map[string]interface{}{}
	switch typeKey {
	case "movies":
		if l, ok := list.(*models.MovieList); ok {
			out["status"] = string(l.Status)
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "anime":
		if l, ok := list.(*models.AnimeSeriesList); ok {
			out["status"] = string(l.Status)
			if l.CurrentEpisode != nil {
				out["currentEpisode"] = *l.CurrentEpisode
			}
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "tv-series":
		if l, ok := list.(*models.TVSeriesList); ok {
			out["status"] = string(l.Status)
			if l.CurrentEpisode != nil {
				out["currentEpisode"] = *l.CurrentEpisode
			}
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "cartoon-series":
		if l, ok := list.(*models.CartoonSeriesList); ok {
			out["status"] = string(l.Status)
			if l.CurrentEpisode != nil {
				out["currentEpisode"] = *l.CurrentEpisode
			}
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "games":
		if l, ok := list.(*models.GameList); ok {
			out["status"] = string(l.Status)
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
			if l.TotalTime != nil {
				out["hoursPlayed"] = float64(*l.TotalTime) / 60
			}
		}
	case "manga":
		if l, ok := list.(*models.MangaList); ok {
			out["status"] = string(l.Status)
			if l.CurrentVolume != nil {
				out["currentVolume"] = *l.CurrentVolume
			}
			if l.CurrentChapter != nil {
				out["currentChapter"] = *l.CurrentChapter
			}
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "books":
		if l, ok := list.(*models.BookList); ok {
			out["status"] = string(l.Status)
			if l.CurrentPage != nil {
				out["currentPage"] = *l.CurrentPage
			}
			if l.MaxPages != nil {
				out["maxPages"] = *l.MaxPages
			}
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "light-novels":
		if l, ok := list.(*models.LightNovelList); ok {
			out["status"] = string(l.Status)
			if l.CurrentVolumeNumber != nil {
				out["currentVolumeNumber"] = *l.CurrentVolumeNumber
			}
			if l.CurrentChapterNumber != nil {
				out["currentChapterNumber"] = *l.CurrentChapterNumber
			}
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	case "cartoon-movies", "anime-movies":
		if l, ok := list.(*models.CartoonMovieList); ok {
			out["status"] = string(l.Status)
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		} else if l, ok := list.(*models.AnimeMovieList); ok {
			out["status"] = string(l.Status)
			if l.Rating != nil {
				out["rating"] = *l.Rating
			}
		}
	}
	return out
}

func getNewListExtra(typeKey string, list interface{}) map[string]interface{} {
	return snapshotListExtra(typeKey, list)
}

// buildActivityExtraFromList собирает extra для ленты активностей.
// При oldSnapshot == nil (добавление в список): только текущие поля (status, currentEpisode, rating, ...).
// При oldSnapshot != nil (обновление): пары fromStatus/toStatus, fromEpisode/toEpisode и т.д.; рейтинг "с X на Y" только если был изменён, иначе просто "оценка N".
func buildActivityExtraFromList(typeKey string, list interface{}, oldSnapshot map[string]interface{}) models.JSONMap {
	if list == nil {
		return nil
	}
	newSnap := getNewListExtra(typeKey, list)
	if len(newSnap) == 0 {
		return nil
	}
	extra := models.JSONMap{}
	isUpdate := len(oldSnapshot) > 0

	for k, newVal := range newSnap {
		oldVal := oldSnapshot[k]
		switch k {
		case "status":
			if isUpdate && oldVal != nil {
				extra["fromStatus"] = oldVal
				extra["toStatus"] = newVal
			} else {
				extra["status"] = newVal
			}
		case "currentEpisode":
			if isUpdate && oldVal != nil {
				extra["fromEpisode"] = oldVal
				extra["toEpisode"] = newVal
			} else {
				extra["currentEpisode"] = newVal
			}
		case "rating":
			if isUpdate && oldVal != nil {
				// изменил рейтинг — показываем с какого на какой
				extra["fromRating"] = oldVal
				extra["toRating"] = newVal
			} else {
				// поставил рейтинг впервые — просто оценка, без "с 0"
				extra["rating"] = newVal
			}
		case "currentPage":
			if isUpdate && oldVal != nil {
				extra["fromPage"] = oldVal
				extra["toPage"] = newVal
			} else {
				extra["currentPage"] = newVal
			}
		case "maxPages":
			if isUpdate && oldVal != nil {
				extra["fromMaxPages"] = oldVal
				extra["toMaxPages"] = newVal
			} else {
				extra["maxPages"] = newVal
			}
		case "currentVolume":
			if isUpdate && oldVal != nil {
				extra["fromVolume"] = oldVal
				extra["toVolume"] = newVal
			} else {
				extra["currentVolume"] = newVal
			}
		case "currentChapter":
			if isUpdate && oldVal != nil {
				extra["fromChapter"] = oldVal
				extra["toChapter"] = newVal
			} else {
				extra["currentChapter"] = newVal
			}
		case "currentVolumeNumber":
			if isUpdate && oldVal != nil {
				extra["fromVolumeNumber"] = oldVal
				extra["toVolumeNumber"] = newVal
			} else {
				extra["currentVolumeNumber"] = newVal
			}
		case "currentChapterNumber":
			if isUpdate && oldVal != nil {
				extra["fromChapterNumber"] = oldVal
				extra["toChapterNumber"] = newVal
			} else {
				extra["currentChapterNumber"] = newVal
			}
		case "hoursPlayed":
			if isUpdate && oldVal != nil {
				extra["fromHoursPlayed"] = oldVal
				extra["toHoursPlayed"] = newVal
			} else {
				extra["hoursPlayed"] = newVal
			}
		default:
			extra[k] = newVal
		}
	}
	if len(extra) == 0 {
		return nil
	}
	return extra
}

// getSeriesTotalEpisodes returns total episodes count for series types (anime, tv-series, cartoon-series).
func getSeriesTotalEpisodes(db *gorm.DB, typeKey string, entityID uint) *int {
	var count *int
	switch typeKey {
	case "anime":
		var m models.AnimeSeries
		if db.Select("episodes_count").First(&m, entityID).Error == nil {
			count = m.EpisodesCount
		}
	case "tv-series":
		var m models.TVSeries
		if db.Select("episodes_count").First(&m, entityID).Error == nil {
			count = m.EpisodesCount
		}
	case "cartoon-series":
		var m models.CartoonSeries
		if db.Select("episodes_count").First(&m, entityID).Error == nil {
			count = m.EpisodesCount
		}
	}
	return count
}

// getListEntityTitle returns the title of the media entity for list notifications.
func getListEntityTitle(db *gorm.DB, typeKey string, entityID uint) string {
	var title string
	switch typeKey {
	case "movies":
		var m models.Movie
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "anime":
		var m models.AnimeSeries
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "games":
		var m models.Game
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "tv-series":
		var m models.TVSeries
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "manga":
		var m models.Manga
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "books":
		var m models.Book
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "light-novels":
		var m models.LightNovel
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "cartoon-series":
		var m models.CartoonSeries
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "cartoon-movies":
		var m models.CartoonMovie
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	case "anime-movies":
		var m models.AnimeMovie
		if db.Select("title").First(&m, entityID).Error == nil {
			title = m.Title
		}
	}
	if title == "" {
		title = typeKey + " #" + strconv.FormatUint(uint64(entityID), 10)
	}
	return title
}

// GET /lists/:type
func GetUserList(c *gin.Context) {
	typeKey := c.Param("type")
	spec := GetListSpec(typeKey)
	if spec == nil {
		api.RespondNotFound(c, "Unknown list type")
		return
	}
	db := deps.GetDB(c)
	userID, _ := c.Get("userID")
	status := c.Query("status")
	data, err := spec.FindLists(db, userID, status)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch list")
		return
	}
	c.JSON(http.StatusOK, data)
}

// AddToList — общий хендлер: POST /lists/:type/:id
func AddToList(c *gin.Context) {
	typeKey := c.Param("type")
	idStr := c.Param("id")
	spec := GetListSpec(typeKey)
	if spec == nil {
		api.RespondNotFound(c, "Unknown list type")
		return
	}
	entityID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid ID", nil)
		return
	}
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	var req models.AddToListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	db := deps.GetDB(c)
	if err := spec.EntityExists(db, uint(entityID)); err != nil {
		api.RespondNotFound(c, spec.Name+" not found")
		return
	}
	_, err = spec.FindOne(db, userID, uint(entityID))
	if err == nil {
		api.RespondConflict(c, spec.Name+" already in list")
		return
	}
	list, err := spec.Create(db, userID, uint(entityID), req)
	if err != nil {
		api.RespondInternal(c, "Failed to add to list")
		return
	}
	services.IncrementListStat(db, userID, spec.EntityType, string(req.Status))
	_ = spec.PreloadAfter(db, list)
	notifTitle := "Added «" + getListEntityTitle(db, typeKey, uint(entityID)) + "» to list"
	CreateNotificationInAppOnly(userID, models.NotificationTypeListUpdate, notifTitle, nil, typeKey, uint(entityID), nil)
	CreateActivityForUser(userID, models.ActivityTypeListAdd, typeKey, uint(entityID), getListEntityTitle(db, typeKey, uint(entityID)), buildActivityExtraFromList(typeKey, list, nil))
	c.JSON(http.StatusCreated, list)
}

// UpdateInList — общий хендлер: PUT /lists/:type/:id (только для типов с ApplyUpdate: movies, anime)
func UpdateInList(c *gin.Context) {
	typeKey := c.Param("type")
	idStr := c.Param("id")
	spec := GetListSpec(typeKey)
	if spec == nil {
		api.RespondNotFound(c, "Unknown list type")
		return
	}
	if spec.ApplyUpdate == nil {
		api.RespondError(c, http.StatusMethodNotAllowed, api.ErrCodeBadRequest, "Update not supported for this list type", nil)
		return
	}
	entityID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid ID", nil)
		return
	}
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	var req models.UpdateListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		api.RespondValidationError(c, err)
		return
	}
	db := deps.GetDB(c)
	list, err := spec.FindOne(db, userID, uint(entityID))
	if err != nil {
		api.RespondNotFound(c, spec.Name+" not in list")
		return
	}
	oldSnapshot := snapshotListExtra(typeKey, list)
	oldStatus, err := spec.ApplyUpdate(db, list, req)
	if err != nil {
		api.RespondInternal(c, "Failed to update list entry")
		return
	}
	if req.Status != nil && *req.Status != oldStatus {
		services.DecrementListStat(db, userID, spec.EntityType, string(oldStatus))
		services.IncrementListStat(db, userID, spec.EntityType, string(*req.Status))
	}
	_ = spec.PreloadAfter(db, list)
	notifTitle := "List updated: «" + getListEntityTitle(db, typeKey, uint(entityID)) + "»"
	CreateNotificationInAppOnly(userID, models.NotificationTypeListUpdate, notifTitle, nil, typeKey, uint(entityID), nil)
	activityExtra := buildActivityExtraFromList(typeKey, list, oldSnapshot)
	if activityExtra != nil && (typeKey == "anime" || typeKey == "tv-series" || typeKey == "cartoon-series") && activityExtra["toEpisode"] != nil {
		if total := getSeriesTotalEpisodes(db, typeKey, uint(entityID)); total != nil {
			activityExtra["totalEpisodes"] = *total
		}
	}
	CreateActivityForUser(userID, models.ActivityTypeListUpdate, typeKey, uint(entityID), getListEntityTitle(db, typeKey, uint(entityID)), activityExtra)
	c.JSON(http.StatusOK, list)
}

// RemoveFromList — общий хендлер: DELETE /lists/:type/:id
func RemoveFromList(c *gin.Context) {
	typeKey := c.Param("type")
	idStr := c.Param("id")
	spec := GetListSpec(typeKey)
	if spec == nil {
		api.RespondNotFound(c, "Unknown list type")
		return
	}
	entityID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid ID", nil)
		return
	}
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)
	db := deps.GetDB(c)
	list, err := spec.FindOne(db, userID, uint(entityID))
	if err != nil {
		api.RespondNotFound(c, spec.Name+" not in list")
		return
	}
	status := spec.GetStatus(list)
	if err := spec.Delete(db, list); err != nil {
		api.RespondInternal(c, "Failed to remove from list")
		return
	}
	services.DecrementListStat(db, userID, spec.EntityType, string(status))
	c.JSON(http.StatusOK, gin.H{"message": spec.Name + " removed from list"})
}

// GET /users/username/:username/lists/:type
func GetUserListByUsername(c *gin.Context) {
	username := strings.TrimSpace(strings.ToLower(c.Param("username")))
	typeKey := c.Param("type")
	if username == "" {
		api.RespondBadRequest(c, "Username required", nil)
		return
	}
	spec := GetListSpec(typeKey)
	if spec == nil {
		api.RespondNotFound(c, "Unknown list type")
		return
	}
	db := deps.GetDB(c)
	var owner models.User
	if err := db.Where("username = ?", username).First(&owner).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}
	if !MustCanViewUserProfile(c, owner.ID) {
		return
	}
	status := c.Query("status")
	data, err := spec.FindLists(db, owner.ID, status)
	if err != nil {
		api.RespondInternal(c, "Failed to fetch list")
		return
	}
	c.JSON(http.StatusOK, data)
}
