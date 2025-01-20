const express = require('express')
const app = express()



app.get("/",(req,res)=>{
    res.send("Pagina Principal")
})


const PORT = 8081
app.listen(PORT,()=>{
    console.log("Servidor rodando na url=http://localhost:8081")
})