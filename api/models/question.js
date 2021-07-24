const Question=require('./schemas/model_question')

const getQuestions= (filter,limit)=>{
return Question.find(filter).limit(limit).select('-Category -QuestionType -Answer')
}
module.exports={
    getQuestions:getQuestions
}