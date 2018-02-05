const Mclient = require('mongodb').MongoClient;

function db(dbName) {
    return new Promise((resolve, reject) => {
        Mclient.connect(mongo_url, (err, client) => {
            if(err) {
                reject(err);
                return console.log(err);
            }
            let col = client.db('czp_h5').collection(dbName);
            resolve({
                col,
                client
            });
        });
    });
    
}

module.exports = {
    db
}