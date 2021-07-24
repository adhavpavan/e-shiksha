const questionModel=require('../models/question')
const publicUtils=require('../helpers/publicUtils')
const getQuestions=(req,res,next)=>{
    let query=req.query;
    let limit=20;
    if(query.limit){
        limit=parseInt(query.limit);
        delete query.limit
    }

questionModel.getQuestions(query,limit).then(questions=>{
    res.status(200).send(
        publicUtils.prepareResponse(
          { questions: questions },
          [],
          true,
          "All Questions"
        )
      );
    
}).catch(err=>{
    res
    .status(500)
    .send(
      publicUtils.prepareResponse(
        { message: err.message },
        err,
        false,
        "error while fetching"
      )
    );
})
}
module.exports={getQuestions}