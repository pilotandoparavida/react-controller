// index, show, store, update, destroy
let path_model = 'reac-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'reac-model-dev';
}
const { Moto } = require(path_model);

module.exports = {
    async index(req, res) {
        try {
            const motos = await Moto.find({}); //,['_id']);
            return res.status(200).send({ msg: "Sucesso", dados: motos });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async show(req, res) {
        try {
            const { aluno_id } = req.params;
            const moto = await Moto.findOne({ aluno: aluno_id });
            if (!moto) {
                return res.status(401).json({ msg: 'Aluno não cadastrado.' });
            }
            return res.status(200).json({ msg: "Sucesso", dados: moto });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    }
};