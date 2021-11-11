package api

import (
	m "github.com/darcys22/godbledger-web/backend/models"
	"github.com/gin-gonic/gin"
	"net/http"
)

func GetJournals(c *gin.Context) {
	journalsModel := m.NewJournalsListing()
	err := journalsModel.SearchJournals()
	if err != nil {
		log.Errorf("Could not get journal listing (%v)", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
	c.JSON(http.StatusOK, journalsModel)
}

func PostJournal(c *gin.Context) {
	var journal m.PostJournalCommand

	if err := c.BindJSON(&journal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := journal.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
	c.JSON(http.StatusOK, journal)
}

func DeleteJournal(c *gin.Context) {
	id := c.Params.ByName("id")

	if err := m.DeleteJournalCommand(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
	c.String(http.StatusOK, "Success")
}

func GetJournal(c *gin.Context) {
	id := c.Params.ByName("id")

	journal, err := m.GetJournalCommand(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}

	c.JSON(http.StatusOK, journal)
}

func EditJournal(c *gin.Context) {
	id := c.Params.ByName("id")
	var journal m.PostJournalCommand

	if err := c.BindJSON(&journal); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := journal.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}

	if err := m.DeleteJournalCommand(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}

	c.JSON(http.StatusOK, journal)
}
