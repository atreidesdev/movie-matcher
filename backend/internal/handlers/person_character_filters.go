package handlers

import (
	"strings"

	"gorm.io/gorm"
)

// personIDsInMediaType returns a subquery: SELECT person_id FROM casts JOIN <cast_table> ON ...
// mediaType: movie, tv-series, anime, anime-movies, cartoon-series, cartoon-movies
func personIDsInMediaType(db *gorm.DB, mediaType string) *gorm.DB {
	switch strings.ToLower(mediaType) {
	case "movie":
		return db.Table("casts").Select("casts.person_id").Joins("JOIN movie_cast ON movie_cast.cast_id = casts.id")
	case "tv-series":
		return db.Table("casts").Select("casts.person_id").Joins("JOIN tvseries_cast ON tvseries_cast.cast_id = casts.id")
	case "anime":
		return db.Table("casts").Select("casts.person_id").Joins("JOIN animeseries_cast ON animeseries_cast.cast_id = casts.id")
	case "anime-movies":
		return db.Table("casts").Select("casts.person_id").Joins("JOIN animemovie_cast ON animemovie_cast.cast_id = casts.id")
	case "cartoon-series":
		return db.Table("casts").Select("casts.person_id").Joins("JOIN cartoonseries_cast ON cartoonseries_cast.cast_id = casts.id")
	case "cartoon-movies":
		return db.Table("casts").Select("casts.person_id").Joins("JOIN cartoonmovie_cast ON cartoonmovie_cast.cast_id = casts.id")
	default:
		return nil
	}
}

// characterIDsInMediaType returns a subquery: SELECT character_id FROM casts JOIN <cast_table> ON ...
func characterIDsInMediaType(db *gorm.DB, mediaType string) *gorm.DB {
	switch strings.ToLower(mediaType) {
	case "movie":
		return db.Table("casts").Select("casts.character_id").Joins("JOIN movie_cast ON movie_cast.cast_id = casts.id").Where("casts.character_id IS NOT NULL")
	case "tv-series":
		return db.Table("casts").Select("casts.character_id").Joins("JOIN tvseries_cast ON tvseries_cast.cast_id = casts.id").Where("casts.character_id IS NOT NULL")
	case "anime":
		return db.Table("casts").Select("casts.character_id").Joins("JOIN animeseries_cast ON animeseries_cast.cast_id = casts.id").Where("casts.character_id IS NOT NULL")
	case "anime-movies":
		return db.Table("casts").Select("casts.character_id").Joins("JOIN animemovie_cast ON animemovie_cast.cast_id = casts.id").Where("casts.character_id IS NOT NULL")
	case "cartoon-series":
		return db.Table("casts").Select("casts.character_id").Joins("JOIN cartoonseries_cast ON cartoonseries_cast.cast_id = casts.id").Where("casts.character_id IS NOT NULL")
	case "cartoon-movies":
		return db.Table("casts").Select("casts.character_id").Joins("JOIN cartoonmovie_cast ON cartoonmovie_cast.cast_id = casts.id").Where("casts.character_id IS NOT NULL")
	default:
		return nil
	}
}

// personIDsInCompanyType returns a subquery for person_id that appear in media linked to company type.
// companyType: studio (media with studios). Only studio is supported.
func personIDsInCompanyType(db *gorm.DB, companyType string) *gorm.DB {
	if strings.ToLower(companyType) != "studio" {
		return nil
	}
	raw := `SELECT person_id FROM (
(SELECT casts.person_id FROM casts JOIN movie_cast ON movie_cast.cast_id = casts.id JOIN movie_studios ON movie_studios.movie_id = movie_cast.movie_id)
UNION
(SELECT casts.person_id FROM casts JOIN tvseries_cast ON tvseries_cast.cast_id = casts.id JOIN tvseries_studios ON tvseries_studios.tv_series_id = tvseries_cast.tv_series_id)
UNION
(SELECT casts.person_id FROM casts JOIN animeseries_cast ON animeseries_cast.cast_id = casts.id JOIN animeseries_studios ON animeseries_studios.anime_series_id = animeseries_cast.anime_series_id)
UNION
(SELECT casts.person_id FROM casts JOIN animemovie_cast ON animemovie_cast.cast_id = casts.id JOIN animemovie_studios ON animemovie_studios.anime_movie_id = animemovie_cast.anime_movie_id)
UNION
(SELECT casts.person_id FROM casts JOIN cartoonseries_cast ON cartoonseries_cast.cast_id = casts.id JOIN cartoonseries_studios ON cartoonseries_studios.cartoon_series_id = cartoonseries_cast.cartoon_series_id)
UNION
(SELECT casts.person_id FROM casts JOIN cartoonmovie_cast ON cartoonmovie_cast.cast_id = casts.id JOIN cartoonmovie_studios ON cartoonmovie_studios.cartoon_movie_id = cartoonmovie_cast.cartoon_movie_id)
) u`
	return db.Raw(raw)
}
