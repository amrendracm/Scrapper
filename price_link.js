const csv = require('csv-parser');
const fs = require('fs');
const puppeteer=require('puppeteer');
const xlsx=require('xlsx');
const nodeCron=require('node-cron');
const json2csv=require("json2csv").Parser;
const filepath = "./Benchmarking - KVI.csv";
const mongodb = require("mongodb");
const express=require('express');


const port = process.env.PORT || 3000;
const grofers = express();

const url =
  "mongodb+srv://vishalCitymall:vishal12345@cluster0.v408j.mongodb.net/test";
var dbConn;
var dbClient;
async function getData(){
    try {
        let doc = []
        let data=[]
        let scrapData=[]


        const client = await mongodb.MongoClient.connect(url, {
            useUnifiedTopology: true,
          });
          console.log("DB Connected!");
          dbConn = await client.db();
          dbClient = client;

    async function find(){
        try{
        fs.createReadStream(filepath)
                .on('error', () => {
                    // handle error
                    console.log("err");
                })
    
                .pipe(csv())
                .on('data', (row) => {
                    doc.push(row);
                })
                .on('end', () => {
                    for (let i = 0; i < doc.length; i++) {
                        let res = doc[i].Grofers_Link;
    
                        if (res.includes("https")) {
                            let val_link = res;
                            data.push(val_link);
    
                        }
    
                    };
                    console.log(data.length);
                })
    }
    catch{
        console.log("not")
    }
    }
    find();
    async function getpagedata(url,page){
    await page.goto(url);
    const title=await page.$eval(".r-14q5wjw",title=>title.textContent);
    const MRP=await page.$eval(".r-142tt33",MRP=>MRP.textContent);
    // MRP = (MRP == "") ? "NULL" : MRP;
    
    const Selling_price=await page.$eval(".r-13wfysu",Selling_price => Selling_price.textContent);
    // Selling_price = (Selling_price == "") ? "NULL" : Selling_price;
    const rating=await page.$eval(".r-1f6r7vd",rating=>rating.textContent);
    // rating = (rating == "") ? "NULL" : rating;
    // if(rating==""){
    //     rating="NULL";
    // }else
    // {
    //     rating=rating;
    // }
    return {
        title:title,
        link:url,
        rating:rating,
        MRP:MRP,
        Selling_price:Selling_price
    }
    };
    async function main(){
        const browser=await puppeteer.launch({headless:false});
        const page=await browser.newPage();
        // const scrapData=[]
        try{
        for(var j=0;j<data.length;j++){
           const datap=await getpagedata(data[j],page);
        scrapData.push(datap);
    }
    
    }catch{
        console.log("error occurs at "+data[j]);
        
    }
    //xlsx
    // const wb=xlsx.utils.book_new();
    // const ws=xlsx.utils.json_to_sheet(scrapData);
    // xlsx.utils.book_append_sheet(wb,ws);
    // xlsx.writeFile(wb,"Details.xlsx");
    const collectionName = "grofersData";
    const collection = dbConn.collection(collectionName);
    collection.deleteMany({});
    await collection.insertMany(scrapData, (err, result) => {
      if (err) console.log(err);
      if (result) {
        console.log("Import CSV into database successfully.");
        console.log("Number of documents inserted: " + result.insertedCount);
        dbClient.close();
      }
    });
    }
    main();
} catch (error) {
      console.log("error");  
}
};
nodeCron.schedule("0 8 * * *", getData);

getData();


grofers.get("/", (req, res) => {
    res.send("hello world");
  });
  
  grofers.listen(port);


