package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/movie-matcher/backend/internal/api"
	"github.com/movie-matcher/backend/internal/deps"
	"github.com/movie-matcher/backend/internal/models"
)

func SendFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")
	receiverID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid user ID", nil)
		return
	}

	if userID.(uint) == uint(receiverID) {
		api.RespondBadRequest(c, "Cannot send friend request to yourself", nil)
		return
	}

	var receiver models.User
	if err := deps.GetDB(c).First(&receiver, receiverID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}

	var existing models.FriendRequest
	if err := deps.GetDB(c).Where("sender_id = ? AND receiver_id = ?", userID, receiverID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Friend request already sent")
		return
	}

	request := models.FriendRequest{
		SenderID:   userID.(uint),
		ReceiverID: uint(receiverID),
	}

	if err := deps.GetDB(c).Create(&request).Error; err != nil {
		api.RespondInternal(c, "Failed to send friend request")
		return
	}

	var sender models.User
	_ = deps.GetDB(c).First(&sender, request.SenderID).Error
	title := "New friend request"
	senderName := ""
	if sender.Username != nil {
		senderName = *sender.Username
		title = "Friend request from " + senderName
	}
	CreateNotificationForUser(uint(receiverID), models.NotificationTypeFriendRequest, title, nil, "friend_request", request.ID, models.JSONMap{"username": senderName})

	c.JSON(http.StatusCreated, request)
}

func GetFriendRequests(c *gin.Context) {
	userID, _ := c.Get("userID")

	var received []models.FriendRequest
	deps.GetDB(c).Where("receiver_id = ?", userID).Preload("Sender").Find(&received)

	var sent []models.FriendRequest
	deps.GetDB(c).Where("sender_id = ?", userID).Preload("Receiver").Find(&sent)

	c.JSON(http.StatusOK, gin.H{
		"received": received,
		"sent":     sent,
	})
}

func AcceptFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")
	requestID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	var request models.FriendRequest
	if err := deps.GetDB(c).Where("id = ? AND receiver_id = ?", requestID, userID).First(&request).Error; err != nil {
		api.RespondNotFound(c, "Friend request not found")
		return
	}

	friendship1 := models.Friendship{UserID: request.SenderID, FriendID: request.ReceiverID}
	friendship2 := models.Friendship{UserID: request.ReceiverID, FriendID: request.SenderID}

	deps.GetDB(c).Create(&friendship1)
	deps.GetDB(c).Create(&friendship2)

	var receiver models.User
	_ = deps.GetDB(c).First(&receiver, request.ReceiverID).Error
	title := "Friend request accepted"
	receiverName := ""
	if receiver.Username != nil {
		receiverName = *receiver.Username
		title = "Accepted by " + receiverName
	}
	CreateNotificationForUser(request.SenderID, models.NotificationTypeFriendAccepted, title, nil, "user", request.ReceiverID, models.JSONMap{"username": receiverName})

	deps.GetDB(c).Delete(&request)

	c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted"})
}

func RejectFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")
	requestID := c.Param("id")

	result := deps.GetDB(c).Where("id = ? AND receiver_id = ?", requestID, userID).Delete(&models.FriendRequest{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Friend request not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request rejected"})
}

func CancelFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")
	requestID := c.Param("id")

	result := deps.GetDB(c).Where("id = ? AND sender_id = ?", requestID, userID).Delete(&models.FriendRequest{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Friend request not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Friend request cancelled"})
}

func GetFriends(c *gin.Context) {
	userID, _ := c.Get("userID")

	var friendships []models.Friendship
	deps.GetDB(c).Where("user_id = ?", userID).Find(&friendships)

	var friendIDs []uint
	for _, f := range friendships {
		friendIDs = append(friendIDs, f.FriendID)
	}

	var friends []models.User
	if len(friendIDs) > 0 {
		deps.GetDB(c).Where("id IN ?", friendIDs).Find(&friends)
	}

	c.JSON(http.StatusOK, userListItemsFromUsers(friends))
}

func RemoveFriend(c *gin.Context) {
	userID, _ := c.Get("userID")
	friendID := c.Param("friendId")

	deps.GetDB(c).Where("user_id = ? AND friend_id = ?", userID, friendID).Delete(&models.Friendship{})
	deps.GetDB(c).Where("user_id = ? AND friend_id = ?", friendID, userID).Delete(&models.Friendship{})

	c.JSON(http.StatusOK, gin.H{"message": "Friend removed"})
}

func FollowUser(c *gin.Context) {
	userID, _ := c.Get("userID")
	followingID, err := strconv.ParseUint(c.Param("userId"), 10, 32)
	if err != nil {
		api.RespondBadRequest(c, "Invalid user ID", nil)
		return
	}

	if userID.(uint) == uint(followingID) {
		api.RespondBadRequest(c, "Cannot follow yourself", nil)
		return
	}

	var user models.User
	if err := deps.GetDB(c).First(&user, followingID).Error; err != nil {
		api.RespondNotFound(c, "User not found")
		return
	}

	var existing models.Follow
	if err := deps.GetDB(c).Where("follower_id = ? AND following_id = ?", userID, followingID).First(&existing).Error; err == nil {
		api.RespondConflict(c, "Already following")
		return
	}

	follow := models.Follow{
		FollowerID:  userID.(uint),
		FollowingID: uint(followingID),
	}

	if err := deps.GetDB(c).Create(&follow).Error; err != nil {
		api.RespondInternal(c, "Failed to follow user")
		return
	}

	var follower models.User
	_ = deps.GetDB(c).First(&follower, userID).Error
	title := "New follower"
	followerName := ""
	if follower.Username != nil {
		followerName = *follower.Username
		title = "New follower: " + followerName
	}
	CreateNotificationForUser(uint(followingID), models.NotificationTypeNewFollower, title, nil, "user", userID.(uint), models.JSONMap{"username": followerName})

	c.JSON(http.StatusCreated, follow)
}

func UnfollowUser(c *gin.Context) {
	userID, _ := c.Get("userID")
	followingID := c.Param("userId")

	result := deps.GetDB(c).Where("follower_id = ? AND following_id = ?", userID, followingID).Delete(&models.Follow{})
	if result.RowsAffected == 0 {
		api.RespondNotFound(c, "Not following")
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Unfollowed"})
}

func GetFollowers(c *gin.Context) {
	userID, _ := c.Get("userID")

	var follows []models.Follow
	deps.GetDB(c).Where("following_id = ?", userID).Find(&follows)

	var followerIDs []uint
	for _, f := range follows {
		followerIDs = append(followerIDs, f.FollowerID)
	}

	var followers []models.User
	if len(followerIDs) > 0 {
		deps.GetDB(c).Where("id IN ?", followerIDs).Find(&followers)
	}

	c.JSON(http.StatusOK, followers)
}

func GetFollowing(c *gin.Context) {
	userID, _ := c.Get("userID")

	var follows []models.Follow
	deps.GetDB(c).Where("follower_id = ?", userID).Find(&follows)

	var followingIDs []uint
	for _, f := range follows {
		followingIDs = append(followingIDs, f.FollowingID)
	}

	var following []models.User
	if len(followingIDs) > 0 {
		deps.GetDB(c).Where("id IN ?", followingIDs).Find(&following)
	}

	c.JSON(http.StatusOK, following)
}
