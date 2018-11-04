const express = require ('express');
const bodyParser = require ('body-parser');
const app = express();
const bcrypt = require ('bcrypt-nodejs');
var knex = require('knex')
const cors = require ('cors');


const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DATABASE_URL,
        ssl: true
    }
  });

app.use (bodyParser.json());
app.use (cors());

app.get ('/', (req,res) => {
            res.json ("it is working");
});


app.post ('/updateuser', (req,res) => {
    const { userId, userName, userEmail, userPassword} = req.body;
    const salt = bcrypt.genSaltSync(5);
    const hash = bcrypt.hashSync(userPassword, salt);
    db('users').where({id : userId, email: userEmail}).update({
        name: userName,
        password: hash      
    }).then(res.status(200).json("User updated !"))
      .catch(err => res.status(400).json("Something went wrong !"))
});

app.post ('/signin', (req,res) => {
    const { email, password} = req.body;
    db('users').returning('*').where({ email : email }).then(response => {
        if (response.length > 0 && bcrypt.compareSync(password, response[0].password)) {
            res.status(200).json ({userid : response[0].id,
                                   name: response[0].name});
        } else {
            res.status(406).json ("Sorry BAD credentials !");
        }
    }).catch(err => res.status(400).json(err));

});

app.post ('/register', (req,res) => {
    const { name, email, password} = req.body;
    const salt = bcrypt.genSaltSync(5);
    const hash = bcrypt.hashSync(password, salt);
    db('users').returning('*').where({ email : email }).then(response => {
        if (response.length > 0) {
            res.status(406).json ("user exists");
            console.log('SERVER SIDE MSG: user exists !')
        } else {
            db('users').insert({
                name: name,
                email: email,
                password: hash
            }).then(console.log)
              .catch(err => res.status(400).json(err));
            res.status(200).json("Succes! User created !");
            console.log('SERVER SIDE MSG: user created !');
        }
    }).catch(err => res.status(400).json(err));    
});

app.post ('/notes', (req,res) => {
    const { id } = req.body;
    db('notes').returning('*').where({ usedid : id}).then(response => {
        res.json (response);
    }).catch(err => res.status(400).json(err));

});

app.post ('/readnote', (req,res) => {
    const { id, noteid } = req.body;
    db('notes').returning('*').where({ usedid : id}).andWhere({ noteid : noteid }).then(response => {
        res.json (response);
    }).catch(err => res.status(400).json(err));

});

app.post ('/addnotes', (req,res) => {
    const { id, title, content} = req.body;
    const utc = new Date().toJSON().slice(0,10).replace(/-/g,'/');
    console.log(id, title, content, utc);
    db('notes').insert({
        usedid: id,
        title: title,
        content: content,
        creationdate: utc
    }).then(console.log)
      .catch(err => res.status(400).json(err));    
    res.json("succes ! note added to the db");
});

app.post ('/updatenote', (req,res) => {
    const { usedid, noteid, title, content} = req.body;
    db('notes').where({usedid : usedid, noteid: noteid}).update({
        title: title,
        content: content      
    }).then(res.status(200).json("Note updated !"))
      .catch(err => res.status(400).json("Something went wrong !"))
});

app.post ('/deletenotes', (req,res) => {
    const { id, noteid} = req.body;
    db('notes').where({usedid : id, noteid: noteid}).del().then(res.status(200).json("Note deleted !"))
      .catch(err => res.status(400).json("Something went wrong !"))
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`app is running on port ${process.env.PORT}`);
});