// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Initialize Express
var app = express();


// Designate our public folder as a static directory
app.use(express.static(__dirname + "/public"));


// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");



// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir


// Database configuration with mongoose
mongoose.connect("mongodb://localhost/hwnextscrapenmangoose");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// First, tell the console what server2.js is doing
console.log("\n******************************************\n" +
            "Grabbing every article title and summary \n" +
            "from the NYTimes.com website:" +
            "\n******************************************\n");

//Routes
//=======

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
// Making a request for nhl.com's homepage
request("https://www.nytimes.com/", function(error, response, html) {

  // Load the body of the HTML into cheerio
  var $ = cheerio.load(html);

  // Empty array to save our scraped data
  var results = [];

  // With cheerio, find each h4-tag with the class "headline-link" and loop through the results
  $(".theme-summary").each(function(i, element) {

    // Save the text of the h4-tag as "title"
    var title = $(element).children(".story-heading").text();

    // Find the h4 tag's parent a-tag, and save it's href value as "link"
    var summary = $(element).children(".summary").text();

    // Make an object with data we scraped for this h4 and push it to the results array
    results.push({
      title: title,
      summary: summary
    });
  });

  // After looping through each h4.headline-link, log the results
  console.log(results);

  Article.collection.insertMany(results, {ordered:false}, function(err, Articles){
    console.log(err);

  });


});

// res.send("Scrape Complete"); -- can not use two res
res.redirect("/");

});

// This will get the articles we scraped from the mongoDB
app.get("/", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}).limit(10).exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.render("home.handlebars" ,{articles:doc});
    }
  });
});

app.get("/saved", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({saved:true}).
  populate('note').
  exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
    
      res.render("saved.handlebars" ,{articles:doc});
      
      console.log("doc",doc);
    }
  });
});

app.post("/saved/:id", function(req,res){
Article.update({ "_id": req.params.id }, {$set:{saved:true}})
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.redirect("/");
      //res.render(".handlebars")
    }
  });

})

app.post("/article/:id/notes", function(req,res) {
  console.log(req.body);
  Note.collection.insertMany([{article:req.params.id, note:req.body}], {saved:true}, function(err, Notes){
    console.log(err);

});
});


// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
      //res.render(".handlebars")
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  console.log(req.body);
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      console.log(doc._id);
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id },{$push: { "note": doc._id }})
      //Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.redirect("/saved");
        }
      });
    }
  });
});


/////Mirita added delete route//////
app.delete("/delete/note/articleid/:id", function(req, res) {

    // Create a new note and pass the req.body to the entry
    console.log(req.body);

    //Find Article
      Article.findOne({ "_id": req.params.id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
  
     Note.delete(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      console.log(doc._id);
      // Use the article id to find and update it's note
      Note.findByIdAndRemove({"_id": req.params.id}, { $pull: {"note": doc._id }})
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.redirect("/saved");
    }
  });
};
});
};
});
});
 



///////////////////

var port = process.env.PORT || 3000;
// Listen on port 3000
app.listen(port, function() {
  console.log("App running on port 3000!");
});
