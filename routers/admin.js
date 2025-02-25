const express = require("express");
const bcrypt = require("bcrypt")
const router = express.Router();
const mongoose = require("mongoose");
require("../models/Categoria");
const Categoria = mongoose.model("categorias");
require("../models/Imovel");
const Imovel = mongoose.model("imoveis");
require("../models/Distrito");
const Distrito = mongoose.model("distritos");
require("../models/Terreno");
const Terreno = mongoose.model("terrenos");
const upload = require("../config/multerConfig");
const UserModel = require("../models/User")

//rotas
const isAuth = (req,res,next)=>{
  if(req.session.isAuth){
      next()

  }else{
      res.redirect("login")
  }
}
//rota principal
router.get("/dashboard", isAuth, (req, res) => {
  res.render("admin/dashboard",{isAdmin:true});
});


//rota de lista de categorias
router.get("/categoriaList", isAuth,(req, res) => {
  Categoria.find()
    .then((categorias) => {
      res.render("admin/categoriaList", { categorias: categorias,isAdmin:true });
    })
    .catch((err) => {
      console.error("Erro ao listar categorias:", err);
      res.redirect("/admin");
    });
});
//Rota de edicao de categoria
router.get("/categoria/edit/:id",isAuth, (req, res) => {
  Categoria.findOne({ _id: req.params.id })
    .then((categoria) => {
      if (!categoria) {
        console.log("Categoria não encontrada!");
        return res.redirect("/admin/categoriaList");
      }

      res.render("admin/editCategoria", { categoria: categoria,isAdmin:true });
    })
    .catch((err) => {
      console.log("Erro ao buscar categoria:", err);
      res.redirect("/admin/categoriaList");
    });
});

//Rota para excluir categoria
router.post("/categoria/deletar", (req, res) => {
  Categoria.deleteOne({ _id: req.body.id })
    .then(() => {
      console.log("Categoria excluida com sucesso!");
      res.redirect("/admin/categoriaList");
    })
    .catch((err) => {
      console.log("Houve uma falha ao excluir categoria" + err);
      res.redirect("/admin/categoriaList");
    });
});

//edicao
router.post("/categoria/edit", (req, res) => {
  Categoria.findOne({ _id: req.body.id })
    .then((categoria) => {
      categoria.nome = req.body.nome;
      categoria.slug = req.body.slug;

      categoria
        .save()
        .then(() => {
          console.log("Categoria editada com sucesso!");
          res.redirect("/admin/categoriaList");
        })
        .catch((err) => {
          console.log("Houve um erro ao salvar a edição da categoria:", err);
          res.redirect("/admin/categoriaList");
        });
    })
    .catch((err) => {
      console.log("Houve um erro ao encontrar a categoria:", err);
      res.redirect("/admin/categoriaList");
    });
});

//rota de adicao de categoria
router.get("/categoria",isAuth, (req, res) => {
  res.render("admin/categoria",{isAdmin:true});
});
//rota para cadastro de categorias no banco de dados
router.post("/categoria", (req, res) => {
  const novaCategoria = {
    nome: req.body.nome,
    slug: req.body.slug,
  };

  new Categoria(novaCategoria)
    .save()
    .then(() => {
      console.log("Categoria cadastrada com sucesso!");
      res.redirect("/admin/categoriaList");
    })
    .catch((err) => {
      console.log("Falha ao cadastrar categoria!" + err);
      res.redirect("/admin/categoriaList");
    });
});
///////////////////////////////////////////////////////////////

//rota de cadastro de distritos
router.get("/cadastrar-distrito",isAuth, (req, res) => {
  res.render("admin/cadastrar-distrito",{isAdmin:true});
});

//rota de listagem de distritos
router.get("/distritoList",isAuth, (req, res) => {
  Distrito.find()
    .then((distritos) => {
      res.render("admin/distritoList", { distritos: distritos ,isAdmin:true});
    })
    .catch((err) => {
      req.flash("error_msg", "Houve uma falha ao listar distritos");
      res.redirect("admin/distritoLIst",{isAdmin:true});
    });
});

//rota de cadastro de distritos no banco de dados
router.post("/cadastrar-distrito", (req, res) => {
  const novoDistrito = {
    nome: req.body.nome,
    slug: req.body.slug,
  };
  new Distrito(novoDistrito)
    .save()
    .then(() => {
      req.flash("success_msg", "Distrito cadastrado com sucesso!");
      res.redirect("/admin/distritoList");
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao cadastrar distrito!");
      res.redirect("/admin/distritoList");
    });
});

///////////////////////////////////////////////////////////////

//rota de adicao de imoveis
router.get("/imoveis",isAuth, (req, res) => {
  Categoria.find()
    .then((categorias) => {
      Distrito.find()
        .then((distritos) => {
          // Renderiza a página passando tanto categorias quanto distritos
          res.render("admin/imoveis", {
            categorias: categorias,
            distritos: distritos,
            isAdmin:true
          });
        })
        .catch((err) => {
          req.flash("error_msg", "Erro ao carregar distritos: ", err);
          res.redirect("/admin/dashboard");
        });
    })
    .catch((err) => {
      console.log("Erro ao carregar categorias: ", err);
      res.redirect("/admin/dashboard");
    });
});
// Rota de adição de imóveis

// Rota para cadastro de imóveis no banco de dados
router.post("/imoveis", upload.array("imagens", 10),isAuth, async (req, res) => {
  var erros = [];

  // Validação do título
  if (
    !req.body.titulo ||
    req.body.titulo == undefined ||
    req.body.titulo == null ||
    req.body.titulo.trim() === ""
  ) {
    erros.push({ texto: "Título inválido!" });
  }

  // Validação do tipo de imóvel
  if (
    !req.body.tipo ||
    req.body.tipo == undefined ||
    req.body.tipo == null ||
    req.body.tipo == ""
  ) {
    erros.push({ texto: "Selecione um tipo de imóvel!" });
  }

  // Validação da descrição
  if (
    !req.body.descricao ||
    req.body.descricao == undefined ||
    req.body.descricao == null ||
    req.body.descricao.trim().length < 20
  ) {
    erros.push({ texto: "A descrição deve ter pelo menos 20 caracteres!" });
  }

  // Validação do endereço
  if (
    !req.body.endereco ||
    req.body.endereco == undefined ||
    req.body.endereco == null ||
    req.body.endereco.trim() === ""
  ) {
    erros.push({ texto: "Endereço inválido!" });
  }

  // Validação do preço
  if (
    !req.body.preco ||
    req.body.preco == undefined ||
    req.body.preco == null ||
    req.body.preco <= 0
  ) {
    erros.push({ texto: "Preço inválido!" });
  }
  // Validação do distrito
  if (
    !req.body.distrito ||
    req.body.distrito == undefined ||
    req.body.distrito == null ||
    req.body.distrito == ""
  ) {
    erros.push({ texto: "Selecione um distrito!" });
  }

  // Se houver erros, retornar para a página com os erros
  if (erros.length > 0) {
    res.render("admin/imoveis", { erros: erros ,isAdmin:true});
  } else {
    try {
      const { titulo, tipo, descricao, endereco, preco, distrito } = req.body;
      const files = req.files;

      const imagens = files.map((file) => ({
        filename: file.originalname,
        path: file.path,
      }));

      const imovel = new Imovel({
        titulo,
        tipo,
        descricao,
        endereco,
        preco,
        imagens,
        distrito,
      });
      await imovel.save();
      res.redirect("imoveisList");
    } catch (error) {
      res.status(500).send("Erro ao cadastrar imóvel: " + error.message);
    }
  }
});
//rota para listagem de imoveis
router.get("/imoveisList",isAuth, async (req, res) => {
  try {
    const categoriaFiltro = req.query.categoria;
    const filtro = categoriaFiltro ? { tipo: categoriaFiltro } : {}; // Usando 'tipo' no filtro

    const imoveis = await Imovel.find(filtro).populate("tipo"); // Aqui, populando o campo 'tipo'

    res.render("admin/imoveisList", { imoveis,isAdmin:true });
  } catch (error) {
    res.status(500).send("Erro ao carregar imóveis: " + error.message);
  }
});
//rota para edicao de imoveis
router.get("/imoveis/edit/:id",isAuth, (req, res) => {
  Imovel.findOne({ id: req.params.id })
    .then((imovel = {}))
    .catch((err) => {
      req.flash(
        "error_msg",
        "Houve um erro ao Carregar o formulario de edicao"
      );
    });

  res.render("admin/editImoveis",{isAdmin:true});
});

router.post("/imoveis/edit/{{_id}}", (req, res) => {

});

//ROta de deletar imoveis
router.get("/imoveis/excluir/:id", async (req, res) => {
  const { id } = req.params;

  console.log("Tentativa de exclusão para o ID:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash('error_msg', 'ID inválido!');
    console.log("ID inválido detectado.");
    return res.redirect('imoveisList');
  }

  try {
    const imovel = await Imovel.findById(id);

    if (!imovel) {
      req.flash('error_msg', 'Imóvel não encontrado!');
      console.log("Imóvel não encontrado.");
      return res.redirect('imoveisList');
    }

    await Imovel.findByIdAndDelete(id);
    req.flash('success_msg', 'Imóvel removido com sucesso!');
    console.log("Imóvel removido com sucesso.");
    return res.redirect('imoveisList');
  } catch (err) {
    console.error('Erro ao excluir imóvel:', err);
    req.flash('error_msg', 'Erro ao tentar remover o imóvel.');
    return res.redirect('imoveisList');
  }
});




//////////////////////////////////////////////////////////////////////////
router.get("/terrenos",isAuth, (req, res) => {
  Distrito.find()
    .then((distritos) => {
      res.render("admin/cadastrar-terreno", { distritos: distritos,isAdmin:true });
    })
    .catch((err) => {
      req.flash("error_msg", "Erro ao carregar distritos: ", err);
      res.redirect("admin/terrenosList",{isAdmin:true});
    });
});

//rota de cadastro de terrenos no banco de dados
// Rota de cadastro de terrenos no banco de dados
router.post( "/terrenos/cadastrar",upload.array("imagens", 5),async (req, res) => {
    var erros = [];

    // Validação do título
    if (
      !req.body.titulo ||
      req.body.titulo === undefined ||
      req.body.titulo === null ||
      req.body.titulo.trim() === ""
    ) {
      erros.push({ texto: "Título inválido!" });
    }

    // Validação da descrição
    if (
      !req.body.descricao ||
      req.body.descricao === undefined ||
      req.body.descricao === null ||
      req.body.descricao.trim().length < 20
    ) {
      erros.push({ texto: "A descrição deve ter pelo menos 20 caracteres!" });
    }

    // Validação do endereço
    if (
      !req.body.endereco ||
      req.body.endereco === undefined ||
      req.body.endereco === null ||
      req.body.endereco.trim() === ""
    ) {
      erros.push({ texto: "Endereço inválido!" });
    }

    // Validação do preço
    if (
      !req.body.preco ||
      req.body.preco === undefined ||
      req.body.preco === null ||
      req.body.preco <= 0
    ) {
      erros.push({ texto: "Preço inválido!" });
    }
    //validacao de area
    if (
      !req.body.area ||
      req.body.area === undefined ||
      req.body.area === null ||
      req.body.area <= 0
    ) {
      erros.push({ texto: "Preço inválido!" });
    }


    // Validação do distrito
    if (
      !req.body.distrito ||
      req.body.distrito === undefined ||
      req.body.distrito === null ||
      req.body.distrito === ""
    ) {
      erros.push({ texto: "Selecione um distrito!" });
    }

    // Se houver erros, retornar para a página com os erros
    if (erros.length > 0) {
      res.render("admin/cadastrar-terreno", { erros: erros });
    } else {
      try {
        // Agora req.body deve conter os campos corretamente
        const { titulo, descricao, endereco, preco, area, distrito } = req.body;

        if (
          !titulo ||
          !descricao ||
          !endereco ||
          !preco ||
          !area ||
          !distrito
        ) {
          return res.status(400).send("Todos os campos são obrigatórios.");
        }

        // Garante que req.files seja um array válido
        const files = req.files || [];
        const imagens = files.map((file) => ({
          filename: file.originalname,
          path: file.path,
        }));

        // Criando o objeto e salvando no banco
        const terreno = new Terreno({
          titulo,
          descricao,
          endereco,
          preco,
          area,
          imagens,
          distrito,
        });

        await terreno.save();
        res.redirect("/admin/terrenosList",{isAdmin:true});
      } catch (error) {
        res.status(500).send("Erro ao cadastrar imóvel: " + error.message);
      }
    }
  }
);

//Rota de listagem de terenos
router.get("/terrenosList",isAuth, async(req, res) => {
  try {
    const terrenos = await Terreno.find().populate("distrito", "nome"); // Popula apenas o nome do distrito

    res.render("admin/terrenosList", { terrenos ,isAdmin:true});
} catch (error) {
    console.error("Erro ao listar terrenos:", error);
    res.status(500).send("Erro ao carregar terrenos.");
}
});
//rota de edicao de terrenos
router.get("/terrenos/edit/:id",isAuth,(req,res)=>{
  Terreno.findOne({id: req.params._id}).then((terreno)=>{
    Distrito.find().then((distritos)=>{
      res.render("admin/editar-terreno",{distritos:distritos ,terreno: terreno,isAdmin:true })

    }).catch((err)=>{
      req.flash("error_msg","HOuve um erro ao listar distritos")
      res.redirect("admin/terrenosList")
    })
  }).catch((err)=>{
    req.flash("error_msg","Houve um erro ao carregar o formulario de edicao")
    res.redirect("admin/terrenosList")

  })
})
//ROta de salvamento de edicoes
router.post('/admin/terreno/edit/:id', async (req, res) => { 
  const { id } = req.params;
  console.log("ID recebido:", id); // Verifica se o ID está chegando

  try {
      const terreno = await Terreno.findById(id);
      if (!terreno) {
          return res.status(404).send("Terreno não encontrado.");
      }

      // Atualiza os dados do terreno
      terreno.titulo = req.body.titulo;
      terreno.descricao = req.body.descricao;
      terreno.endereco = req.body.endereco;
      terreno.preco = req.body.preco;
      terreno.area = req.body.area;
      terreno.distrito = req.body.distrito;

      if (req.files) {
          const imagens = req.files.map(file => ({
              filename: file.originalname,
              path: file.path
          }));
          terreno.imagens = imagens;
      }

      await terreno.save();
      res.redirect('/admin/terrenosList');
  } catch (error) {
      res.status(500).send("Erro ao editar o terreno: " + error.message);
  }
});

router.get("/api/totais",isAuth, async (req, res) => {
  try {
      const totalImoveis = await Imovel.countDocuments();
      const totalTerrenos = await Terreno.countDocuments();
      res.json({ totalImoveis, totalTerrenos });
  } catch (error) {
      console.error("Erro ao buscar os totais:", error);
      res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

////////////////////////////////////////////////////////////////////
//sessao de login
router.get("/login",(req,res)=>{
  res.render("admin/login", { error: req.flash("error"),isAdmin:true })
})

//
//router.get("/registrar",(req,res)=>{
  //res.render("admin/registrar")
//})
router.post("/registrar", async (req, res) => {
  try {
      const { username, email, password } = req.body;
      console.log(req.body)

      // Verificar se o usuário já existe
      let user = await UserModel.findOne({ email });
      if (user) {
          return res.redirect("admin/registrar"); 
      }

      // Hash da senha
      const hashpw = await bcrypt.hash(password, 12);

      // Criar novo usuário
      user = new UserModel({
          username,
          email,
          password: hashpw, 
      });

      await user.save(); 
      console.log("Usuário criado com sucesso!");
      req.session.isAuth = true;
      res.redirect("/admin/login"); 
  } catch (err) {
      console.error("Erro ao registrar usuário:", err);
      res.status(500).send("Erro no servidor");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verifica se o usuário existe
    const user = await UserModel.findOne({ email });

    if (!user) {
      console.log("Usuário não encontrado!");
      //req.flash("error","Email ou Senha incorretos!")
      return res.redirect("/admin/login");
    }

    // Verifica se a senha está correta
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Senha incorreta!");
      req.flash("error","Essas credenciais não correspondem aos nossos registros.")
      return res.redirect("/admin/login");
    }

    // Login bem-sucedido, cria sessão
    req.session.isAuth = true;
    req.session.user = { id: user._id, email: user.email, role: user.role }; // Armazena dados relevantes do usuário
    console.log("Login bem-sucedido!");

    return res.redirect("/admin/dashboard");


  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).send("Erro interno do servidor!");
  }
});

router.post("/logOut", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error("Erro ao encerrar sessão:", err);
          return res.status(500).send("Erro ao sair!");
      }
      res.redirect("login"); // Corrigido o caminho
  });
});





/////////////////////////////////////////////////////////////////////////
router.get("/usuariosInteresados", (req, res) => {
  res.render("admin/usuariosinteresados",{isAdmin:true});
});
////////////////////////////////////////////////////////////////////////


module.exports = router;
