const express = require('express')
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const EmailValidator = require('email-deep-validator');
const emailValidator = new EmailValidator();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
app.use(cors())
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.listen(process.env.PORT || 4000);
const URL = "mongodb+srv://dbuser:helloworld@moneycluster.kn2e9.mongodb.net/Money?retryWrites=true&w=majority"
const DB = "Money";
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "unnamedbot2oo5@gmail.com",
      pass: "Liverpool@2019"
      
    }
  });

  app.post("/register",async(req,res)=>{
    console.log("register");
   try{  
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(req.body.email);
    if(wellFormed && validDomain && validMailbox)
    {
    if((await db.collection("user").find({email:req.body.email}).toArray()).length==0)
    {
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password,salt);
        req.body.password = hash;
        await db.collection("user").insertOne(req.body);
        res.json({
            "message":"Registered"
        })
    }
    else
    {
        res.json({
            "message":"user already exist"
        })    
    } }
    else
    {
        res.json({
            "message":"Enter valid email id"
        })
    }
    connection.close();
   }
    catch(error)
    {
        console.log(error);
    }
   
})
app.post("/login",async(req,res)=>{
    console.log("login");
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
   // console.log(req.body.email);
    let user = await db.collection("user").find({email:req.body.email}).toArray() ;
    //console.log("user",user);
    if(user.length!=0)
    {
      //console.log(req.body.password,user[0].password)
      let isPassword = await bcrypt.compare(req.body.password,user[0].password);
      //console.log(isPassword);
      if(isPassword)
      {
             let token = jwt.sign({_id:user[0]._id},"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
             res.json({
             "message" : "Allowed",
             token ,
             userid : user[0]._id
        })
      }else
      {
        res.json({
            "message" : "Login id or password is wrong"
        })
      }
      
    }
    else
    {
        res.json({
            "message" : "Login id or password is wrong"
        }) 
    }
    connection.close();
})
app.post("/email",async (req,res)=>{
    console.log("email");
    try{  
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(req.body.email);
        if(wellFormed && validDomain && validMailbox)
        { 
            let user = await db.collection("user").find({email:req.body.email}).toArray();
           // console.log(user)
            if(user.length!=0)
            {
                let mailOptions = {
                    from: 'unnamedbot2oo5@gmail.com', // TODO: email sender
                    to: req.body.email, // TODO: email receiver
                    subject: 'Password reset',
                    text: `Reset your password using the link : http://localhost:3000/resetpassword/${user[0]._id}`
                };
                
                // Step 3
                transporter.sendMail(mailOptions, (err, data) => {
                    if (err) {
                        console.log(err);
                    }
                    
                });
                res.json({"message":'Email sent!!! check your inbox',
                "sent":true});
            }
            else
            {
                res.json({
                    "message":"Please Register to access",
                    "sent":false
                })     
            }
        }
        else
        {
           res.json({
                "message":"Please enter valid email",
                "sent":false
            })
        } 
        connection.close();
    }
    catch(err)
    {
      console.log(err)
      res.json({
        "message":"Please enter valid email",
        "sent":false
    })
    }
})
app.put("/changepassword/:id",async (req,res)=>{
    console.log("change password");
    try
    {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password,salt);
        req.body.password = hash;
        await db.collection("user").updateOne({_id:mongodb.ObjectID(req.params.id)},{$set:{password :req.body.password}})
        res.json({"message":"Password changed"});
    }
    catch(err)
    {
     console.log("error :",err)
    }
})
app.post("/addincome",verification,async (req,res)=>{
    console.log("addincome");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("income").insertOne(req.body);
    res.json({
        "message":"Added"
    })
    await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{income:result.ops[0]._id}})
    await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$inc:{totalincome:req.body.amount,balance:req.body.amount}})
    let list = await db.collection("user").find({_id:mongodb.ObjectID(req.body.userid)}).toArray();
    if(list[0].last10.length<10)
    {
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{last10:req.body}})
    }
    else
    {
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$pop :{last10: -1}})
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{last10:req.body}})
    }
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})
app.post("/addexpense",verification,async (req,res)=>{
    console.log("addexpense");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("expense").insertOne(req.body);
    res.json({
        "message":"Added"
    })
    await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{expense:result.ops[0]._id}})
    await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$inc:{totalexpense:req.body.amount,balance:-(req.body.amount)}})
    let list = await db.collection("user").find({_id:mongodb.ObjectID(req.body.userid)}).toArray();
    if(list[0].last10.length<10)
    {
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{last10:req.body}})
    }
    else
    {
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$pop :{last10: -1}})
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$push :{last10:req.body}})
    }
   
 
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})
app.post("/delete",verification,async (req,res)=>{
    console.log("delete");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    await db.collection(req.body.mode).deleteOne({_id:mongodb.ObjectID(req.body.postid)});
    res.json({
        "message":"Deleted"
    })
    if(req.body.mode==="income")
    {
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$pull:{income:mongodb.ObjectID(req.body.postid)}})
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$inc:{totalincome:-(req.body.amount),balance:-(req.body.amount)}})
    }
    else
    {
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$pull :{expense:req.body.postid}})
        await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$inc:{totalexpense:-(req.body.amount),balance:(req.body.amount)}})
    }
    await db.collection("user").update({_id:mongodb.ObjectID(req.body.userid)},{$pull:{last10:{_id:mongodb.ObjectID(req.body.postid)}}})
   
   
 
   }
    catch(err)
    {
        console.log(err);
    }
    connection.close();
})
app.post("/getdata",verification,async (req,res)=>{
    console.log("get data");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    if(req.body.type==="Any")
    {  
      
        let result = await db.collection(req.body.mode).find({ $and: [ { userid:req.body.userid },{ year: { $gte:req.body.fromyear} } ,{ year:{ $lte:req.body.toyear} }] }).toArray();
        console.log(result)
        let temp = filter(req.body,result);
       res.send(temp);
         
    }
    else
    {
        
        let result = await db.collection(req.body.mode).find({ $and: [ { userid:req.body.userid },{type:req.body.type}, { year: { $gte:req.body.fromyear} } ,{ year:{ $lte:req.body.toyear} }] }).toArray();  
        let temp = filter(req.body,result);
        res.send(temp);
      }
   
    }
    catch(err)
    {
        console.log(err)
    }
    connection.close();
})
app.put("/changename/:id",verification,async (req,res)=>{
    console.log("Changename");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    await db.collection("user").update({_id:mongodb.ObjectID(req.params.id)},{$set:{name:req.body.name}});
    res.json({
        "message":"Changed"
    })
    }
    catch(err)
    {
        console.log(err)
    }
    connection.close();
})
app.get("/getprofile/:id",verification,async (req,res)=>{
    console.log("Getprofile");
    try{
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    let result = await db.collection("user").find({_id:mongodb.ObjectID(req.params.id)}).toArray();
    res.send(result[0]);
    }
    catch(err)
    {
        console.log(err)
    }
    connection.close();
})
function verification(req,res,next)
{ 
  //  console.log("Verification",req.body)
      if(req.headers.authorization)
  {
      try
      {
          let check = jwt.verify(req.headers.authorization,"ksdsfsdgsdgdfhdsabgdghsdlhgldsdsaf");
          if(check)
          {
              next();
          }
          else
          {
              res.json({
                "message":"authorization failed_!"           
              })
          }
      }
      catch(err)
      {
        console.log(err)
        res.json({
            "message":"authorization failed_2"           
          })
      }
  }   
  else
  {
    res.json({
        "message":"authorization failed"           
      })  
  }
}

function filter(obj,result)
{
    let res = [];
    for(let i=0;i<result.length;i++)
    {
      //console.log("from filter--",result[i]);
      if(obj.fromyear===result[i].year)
      {   
          //console.log("1");
          if(obj.frommonth===result[i].month && obj.fromdate<=result[i].date)
          { 
            //console.log("2");
                res.push(result[i]);
              
          }
          else
          {
           // console.log("3");
              if(obj.toyear!=obj.fromyear && obj.frommonth<result[i].month)
              {
                //console.log("4");
                res.push(result[i]);
                  
              }
              else
              {     //console.log("5");
                     if(obj.tomonth>result[i].month && result[i].month>obj.frommonth)
                     {  //console.log("6");
                        res.push(result[i]);
                     }
                     else
                     {   //console.log("7");
                         if(obj.tomonth===result[i].month && obj.todate>=result[i].date)
                         {   
                            //console.log("8"); 
                            res.push(result[i]);
                         }
                     }
              }
          }
      }
      else
      {   //console.log("9");
          if(obj.fromyear<result[i].year && obj.toyear > result[i].year)
          { //console.log("10");
            res.push(result[i]);
          }
          else
          {   //console.log("11");
              if(obj.toyear===result[i].year)
              { // console.log("12");
                 if(result[i].month===obj.tomonth && result[i].date<=obj.todate)
                 {  
                    //console.log("13"); 
                    res.push(result[i]);
                 }
                 else
                 {   //console.log("14");
                     if(result[i].month<obj.tomonth)
                     {  //console.log("15");
                        res.push(result[i]);
                     }
                 }
              }
          }
      }
    } 
   // console.log(res)
    return res;
}
