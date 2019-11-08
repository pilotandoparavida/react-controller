// index, show, store, update, destroy
const AlunoTurmaController = require('./AlunoTurmaController');
let path_model = 'react-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'react-model-dev';
}
console.log(path_model);
const { Turma } = require(path_model);

module.exports = {
    async store(req, res) {
        try {
            const { data, endereco, descricao, confirmar } = req.body;

            const turma = await Turma.create({ data, endereco, descricao, confirmar });

            if ("vagas" in req.body) {
                turma.vagas = req.body["vagas"];
            }

            if ("totalinscritos" in req.body) {
                turma.totalinscritos = req.body["totalinscritos"];
            }

            if ("estado" in req.body) {
                turma.estado = req.body["estado"];
            }

            if ("googlemaps" in req.body) {
                turma.googlemaps = req.body["googlemaps"];
            }

            await turma.save();

            const msg_tc = await AlunoTurmaController.update(turma._id);

            return res.status(200).json({ msg: ["Nova turma adicionada com sucesso", msg_tc], dados: turma });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async show(req, res) {
        try {
            const { turma_id } = req.params;
            const turma = await Turma.findById(turma_id);
            if (!turma) {
                return res.status(400).json({ msg: 'Turma não cadastrada.' });
            }
            return res.status(200).json({ msg: "Sucesso", dados: turma });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async list(req, res) {
        try {
            const turma = await Turma.find();
            return res.status(200).json({ msg: "Sucesso", dados: turma });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    }
};