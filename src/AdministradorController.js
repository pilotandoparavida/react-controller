// index, show, store, update, destroy
let path_model = 'model_ppv'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'model_ppv_dev';
}
const { Administrador } = require(path_model);

module.exports = {
    async store(req, res) {
        try {
            const { nome, email, login, senha } = req.body;
            const administrador = await Administrador.create({ nome, email, login, senha });
            if (!administrador) {
                return res.status(400).json({ msg: 'Administrador não cadastrado.' });
            }
            return res.status(200).json({ msg: 'Administrador cadastrado com sucesso', dados: administrador });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async show(req, res) {
        try {
            const { login, senha } = req.headers;
            const administrador = await Administrador.findOne({ login });
            if (!administrador) {
                return res.status(401).json({ msg: 'Administrador não cadastrado.' });
            }
            if (administrador.senha === senha) {
                // Generate new hash login
                const hash = Date.now().toString(36);
                administrador.hash = hash;
                await administrador.save();
                return res.status(200).json({ msg: "Sucesso", dados: hash });
            }
            return res.status(401).json({ error: 'Senha incorreta.' });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    }
};