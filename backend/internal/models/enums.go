package models

type MediaType string

const (
	MediaTypeMovie         MediaType = "movie"
	MediaTypeTVSeries      MediaType = "tvSeries"
	MediaTypeAnimeMovie    MediaType = "animeMovie"
	MediaTypeAnimeSeries   MediaType = "animeSeries"
	MediaTypeCartoonMovie  MediaType = "cartoonMovie"
	MediaTypeCartoonSeries MediaType = "cartoonSeries"
	MediaTypeGame          MediaType = "game"
	MediaTypeManga         MediaType = "manga"
	MediaTypeBook          MediaType = "book"
	MediaTypeLightNovel    MediaType = "lightNovel"
)

type ReviewStatus string

const (
	ReviewStatusNeutral               ReviewStatus = "neutral"
	ReviewStatusPositive              ReviewStatus = "positive"
	ReviewStatusNegative              ReviewStatus = "negative"
	ReviewStatusSurprised             ReviewStatus = "surprised"
	ReviewStatusDisappointed          ReviewStatus = "disappointed"
	ReviewStatusExcited               ReviewStatus = "excited"
	ReviewStatusConfused              ReviewStatus = "confused"
	ReviewStatusLaugh                 ReviewStatus = "laugh"
	ReviewStatusBoring                ReviewStatus = "boring"
	ReviewStatusCry                   ReviewStatus = "cry"
	ReviewStatusCool                  ReviewStatus = "cool"
	ReviewStatusCold                   ReviewStatus = "cold"
	ReviewStatusScary                 ReviewStatus = "scary"
	ReviewStatusShushing              ReviewStatus = "shushing"
	ReviewStatusExplodingHead         ReviewStatus = "exploding_head"
	ReviewStatusFaceHoldingBackTears  ReviewStatus = "face_holding_back_tears"
	ReviewStatusKiss                  ReviewStatus = "kiss"
	ReviewStatusPleadingFace          ReviewStatus = "pleading_face"
	ReviewStatusSalutingFace          ReviewStatus = "saluting_face"
)

type AgeRating string

const (
	AgeRatingG    AgeRating = "g"
	AgeRatingPG   AgeRating = "pg"
	AgeRatingPG13 AgeRating = "pg13"
	AgeRatingR    AgeRating = "r"
	AgeRatingNC17 AgeRating = "nc17"
	AgeRatingNC21 AgeRating = "nc21"
	AgeRatingTVY  AgeRating = "tvY"
	AgeRatingTVY7 AgeRating = "tvY7"
	AgeRatingTVG  AgeRating = "tvG"
	AgeRatingTVPG AgeRating = "tvPg"
	AgeRatingTV14 AgeRating = "tv14"
	AgeRatingTVMA AgeRating = "tvMa"
)

type MediaStatus string

const (
	MediaStatusAnnounced    MediaStatus = "announced"    // Анонсировано
	MediaStatusInProduction MediaStatus = "in_production" // В производстве
	MediaStatusReleased     MediaStatus = "released"     // Вышло / выходит
	MediaStatusFinished     MediaStatus = "finished"     // Завершено
	MediaStatusCancelled    MediaStatus = "cancelled"    // Отменено
	MediaStatusPostponed    MediaStatus = "postponed"    // Отложено
)

type Profession string

const (
	ProfessionActor          Profession = "actor"
	ProfessionActress        Profession = "actress"
	ProfessionDirector       Profession = "director"
	ProfessionProducer       Profession = "producer"
	ProfessionWriter         Profession = "writer"
	ProfessionCinematographer Profession = "cinematographer"
	ProfessionComposer       Profession = "composer"
	ProfessionEditor         Profession = "editor"
	ProfessionAnimator       Profession = "animator"
	ProfessionVoiceActor     Profession = "voiceActor"
	ProfessionAuthor         Profession = "author"       // Книги, манга, ранобэ
	ProfessionIllustrator    Profession = "illustrator"  // Иллюстратор (книги, ранобэ)
	ProfessionArtist         Profession = "artist"       // Художник (манга, комиксы)
	ProfessionGameDesigner   Profession = "gameDesigner" // Геймдизайнер (игры)
	ProfessionLevelDesigner  Profession = "levelDesigner"
	ProfessionTranslator     Profession = "translator"   // Переводчик (книги, локализация)
	ProfessionLiteraryEditor Profession = "literaryEditor" // Литературный редактор (книги)
)

type RoleType string

const (
	RoleTypeMain       RoleType = "main"
	RoleTypeSupporting RoleType = "supporting"
	RoleTypeCameo      RoleType = "cameo"
	RoleTypeExtra      RoleType = "extra"
	RoleTypeNarrator   RoleType = "narrator"
	RoleTypeGuest      RoleType = "guest"
	RoleTypeBackground RoleType = "background"
)

type ListStatus string

const (
	ListStatusWatching   ListStatus = "watching"
	ListStatusPlanned    ListStatus = "planned"
	ListStatusCompleted  ListStatus = "completed"
	ListStatusOnHold     ListStatus = "onHold"
	ListStatusDropped    ListStatus = "dropped"
	ListStatusRewatching ListStatus = "rewatching"
)

type TitleReaction string

const (
	TitleReactionSurprised    TitleReaction = "surprised"    // 😲
	TitleReactionDisappointed TitleReaction = "disappointed" // 😞
	TitleReactionSad          TitleReaction = "sad"          // 😢
	TitleReactionJoyful       TitleReaction = "joyful"       // 😊
	TitleReactionInspiring    TitleReaction = "inspiring"    // ✨
	TitleReactionScary        TitleReaction = "scary"        // 😱
	TitleReactionFunny        TitleReaction = "funny"         // 😂
	TitleReactionAngry        TitleReaction = "angry"         // 😠
	TitleReactionLove         TitleReaction = "love"          // 😍
	TitleReactionNeutral      TitleReaction = "neutral"       // 😐
	TitleReactionBoring       TitleReaction = "boring"       // 😴
	TitleReactionExciting     TitleReaction = "exciting"     // 🤩
	TitleReactionTouching     TitleReaction = "touching"      // 🥲
	TitleReactionThoughtful   TitleReaction = "thoughtful"   // 🤔
)

func ValidTitleReaction(s string) bool {
	switch TitleReaction(s) {
	case TitleReactionSurprised, TitleReactionDisappointed, TitleReactionSad, TitleReactionJoyful,
		TitleReactionInspiring, TitleReactionScary, TitleReactionFunny, TitleReactionAngry,
		TitleReactionLove, TitleReactionNeutral, TitleReactionBoring, TitleReactionExciting,
		TitleReactionTouching, TitleReactionThoughtful:
		return true
	}
	return false
}

type AnimeSeason string

const (
	AnimeSeasonWinter AnimeSeason = "winter"
	AnimeSeasonSpring AnimeSeason = "spring"
	AnimeSeasonSummer AnimeSeason = "summer"
	AnimeSeasonAutumn AnimeSeason = "autumn"
)

type MediaRelationType string

const (
	MediaRelationPrequel            MediaRelationType = "prequel"
	MediaRelationSequel             MediaRelationType = "sequel"
	MediaRelationSpinOff            MediaRelationType = "spinOff"
	MediaRelationAlternativeVersion MediaRelationType = "alternativeVersion"
	MediaRelationSideStory          MediaRelationType = "sideStory"
	MediaRelationCrossover          MediaRelationType = "crossover"
	MediaRelationCompilation        MediaRelationType = "compilation"
	MediaRelationRemake             MediaRelationType = "remake"
	MediaRelationRemaster           MediaRelationType = "remaster"
	MediaRelationAdaptation         MediaRelationType = "adaptation"
)
