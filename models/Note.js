// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var NoteSchema = new Schema({
  // title is a required string
  note: {
    type: String,
    required: true
  },
  // This only saves one note's ObjectId, ref refers to the Note model
  article: {
    type: Schema.Types.ObjectId,
    ref: "Article"
  }
});

// Create the Article model with the ArticleSchema
var Note = mongoose.model("Note", NoteSchema);

// Export the model
module.exports = Note;
