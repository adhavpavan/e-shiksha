const mongoose=require('mongoose')

let questionSchema=mongoose.Schema({
Question:{
    type:String,
    required:true
},
Subject:{
    type:String,
    required:true
},
Category:{
    type:String,
    required:true
},
Options:{
    type:Array,
    required:true
},
QuestionType:{
    type:Number,
    
},
Answer:{
    type:String
},
Marks:{
    type:Number
},
DifficultyLevel:{
    type:Number
}
});
module.exports=mongoose.model('Questions',questionSchema,'Questions')