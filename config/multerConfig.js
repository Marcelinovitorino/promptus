const multer = require("multer");
const path = require("path");

// Configuração do armazenamento de arquivos
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      // Diretório onde os arquivos serão armazenados
      cb(null, "uploads/"); // Pasta 'uploads' na raiz do projeto
   },
   filename: function (req, file, cb) {
      // Nome único para o arquivo usando o timestamp + nome original
      cb(null, Date.now() + '-' + file.originalname);
   }
});

// Função de filtro para aceitar apenas tipos de arquivos específicos
const fileFilter = (req, file, cb) => {
   const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
   if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Permite o upload do arquivo
   } else {
      cb(new Error("Tipo de arquivo não permitido"), false); // Rejeita o arquivo
   }
};

// Configuração do multer com limite de 10 arquivos
const upload = multer({
   storage: storage,
   limits: {
      fileSize: 5 * 1024 * 1024 // Limite de 5MB por arquivo
   },
   fileFilter: fileFilter
});

module.exports = upload;
