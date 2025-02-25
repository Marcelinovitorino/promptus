const express = require("express");
const { create } = require("express-handlebars");
const session = require("express-session");
const Handlebars = require("handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const mongodbSession = require("connect-mongodb-session")(session)
const admin = require("./routers/admin");
const path = require("path");
const upload = require("./config/multerConfig");

const flash = require("connect-flash");
const favicon = require("serve-favicon");

require("./models/Imovel");
const Imovel = mongoose.model("imoveis");
require("./models/Distrito");
const Distrito = mongoose.model("distritos");
require("./models/Terreno");
const Terreno = mongoose.model("terrenos");

const app = express();

const mongoUri ="mongodb://localhost:27017/promptus"

// Conexão com o MongoDB
mongoose
  .connect(mongoUri, {
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar:", err));
  //conexao mongodb session
const store = new mongodbSession({
  uri: mongoUri,
  collection: "mysessions"
});

store.on("error", (error) => {
  console.error("Erro no armazenamento de sessões:", error);
});


// Configuração da Sessão e Flash
app.use(session({
    secret: "meu segredo",
    resave: false,
    saveUninitialized: false,
    store: store, // Verifique que a store está corretamente definida
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 dia
        httpOnly: true,
        secure: false // Mude para true em produção com HTTPS
    }
}));
app.use(flash());

// Middleware para mensagens Flash
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Ignorar favicon.ico para evitar erros
app.use((req, res, next) => {
  if (req.url === "/favicon.ico") {
    return res.status(204).end();
  }
  next();
});

app.use(
  "/favicon.ico",
  express.static(path.join(__dirname, "public", "favicon.ico"))
);

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do Handlebars
const exphbs = create({
  defaultLayout: "main",
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  helpers: {
    eq: function (a, b) {
      return a == b;
    },
    truncate: function (str, len) {
      if (str && str.length > len) {
        return str.substring(0, len) + "...";
      }
      return str;
    },
  },
});

app.engine("handlebars", exphbs.engine);
app.set("view engine", "handlebars");



// Pasta pública
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rotas


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/e-marketplace", (req, res) => {
  res.render("e-marketplace");
});

app.get("/imoveis", async (req, res) => {
  try {
    const imoveis = await Imovel.find({});
    const distritos = await Distrito.find({});
    res.render("imoveis", { imoveis, distritos });
  } catch (error) {
    res
      .status(500)
      .send("Erro ao carregar imóveis e distritos: " + error.message);
  }
});

// Rota de listagem de imóveis por distrito
app.get("/distrito/:slug", async (req, res) => {
  try {
    const distrito = await Distrito.findOne({ slug: req.params.slug });

    if (!distrito) {
      req.flash("error_msg", "Este distrito não existe!");
      return res.redirect("/imoveis");
    }

    const imoveis = await Imovel.find({ distrito: distrito._id });
    res.render("imoveis-Distrito", { imoveis, distrito });
  } catch (err) {
    req.flash(
      "error_msg",
      "Houve um erro ao carregar a página deste distrito: " + err
    );
    res.redirect("/imoveis");
  }
});

// Rota de detalhes do imóvel
app.get("/imovel/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return req.flash("error_msg", "ID inválido");
  }

  try {
    const imovel = await Imovel.findById(id);
    if (!imovel) {
      return req.flash("error_msg", "Imóvel não encontrado");
    }

    res.render("detalhesImovel", { imovel }); // Renderiza a view e envia os detalhes
  } catch (error) {
    res.status(500).render("error", { message: "Erro no servidor" });
  }
});

// Rota de terrenos
app.get("/terrenos", async (req, res) => {
  try {
    const terrenos = await Terreno.find({});
    const distritos = await Distrito.find({});
    res.render("terrenos", { terrenos, distritos });
  } catch (error) {
    res
      .status(500)
      .send("Erro ao carregar imóveis e distritos: " + error.message);
  }
});

//Rota de listagem de terrenos por distrito
app.get('/terrenos/:slug', async (req, res) => {
  const slug = req.params.slug;
  try {
      // Buscar o distrito pelo slug
      const distrito = await Distrito.findOne({ slug: slug });

      if (!distrito) {
          return res.status(404).send('Distrito não encontrado.');
      }

      // Buscar terrenos relacionados ao distrito
      const terrenos = await Terreno.find({ distrito: distrito._id }).populate('distrito');

      console.log('Terrenos encontrados:', terrenos);

      res.render('terrenos', { terrenos, distrito: distrito.nome });
  } catch (err) {
      console.error('Erro ao buscar terrenos:', err);
      res.status(500).send('Erro ao carregar os terrenos.');
  }
});


//Rota de detalhes do terreno
app.get("/terreno/:id",async(req,res)=>{
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return req.flash("error_msg", "ID inválido");
  }

  try {
    const terreno = await Terreno.findById(id);
    if (!terreno) {
      return req.flash("error_msg", "Imóvel não encontrado");
    }

    res.render("detalhesTerreno", { terreno }); // Renderiza a view e envia os detalhes
  } catch (error) {
    res.status(500).render("error", { message: "Erro no servidor" });
  }

})

// Outras rotas
app.get("/sobre-nos", (req, res) => {
  res.render("sobre-nos");
});

app.get("/contacto", (req, res) => {
  res.render("contacto");
});

app.get("/quero-fazer-parte", (req, res) => {
  res.render("quero-fazer-parte");
});

// Removendo duplicação da rota favicon
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.use(express.json()); // Para interpretar JSON no corpo da requisição
app.use(express.urlencoded({ extended: true })); // Para interpretar dados de formulários

app.use("/admin", admin);
// Iniciar o servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na URL: http://localhost:${PORT}`);
});
