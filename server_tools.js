let fs = require('fs');
let mysql = require('mysql');

exports.serveStaticFile = (filename, res)=>{
    if(filename == "/"){
        filename = "/index.html";
    }
    let readStaticFile = (ct, filename)=>{
        fs.readFile("." + filename, (err, data)=>{
            if(err){
                res.writeHead(404, {'Content-Type':'text/plain'});
                res.end("file not found");
                return;
            }
            res.writeHead(200, {'Content-Type':ct});
            return res.end(data);
        });

    };
    let extToCT = {
        ".html" : "text/html",
        ".css" : "text/css",
        ".js" : "application/javascript",
        ".jpg" : "image/jpeg",
        ".png" : "image/png",
    };
    let indexOfDot = filename.lastIndexOf(".");
    if(indexOfDot == -1){
        res.writeHead(400, {"Content-Type":"text/plain"});
        res.end("invalid file name (no extension).");
        return;
    }
    
    let ext = filename.substring(indexOfDot);
    let ct = extToCT[ext];
    if(!ct){
        res.writeHead(400, {"Content-Type":"text/plain"});
        res.end("invalid file name (unknown extension).");
        return;
    }
    readStaticFile(ct, filename);
};

exports.query = (sql, params, callback)=>{
    let conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "naMA3377",
        database: "connect4"
    });
    conn.connect((err)=>{
        if(err){
            callback(null, err);
            return;
        }
        conn.query(sql, params, (err, result, fields)=>{
            callback(result, err);
        });
        conn.end();
    });
};