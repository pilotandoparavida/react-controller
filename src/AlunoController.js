// index, show, store, update, destroy
let path_model = 'reac-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'reac-model-dev';
}
const AlunoTurmaController = require('./AlunoTurmaController');
const { Aluno, Moto } = require(path_model);

module.exports = {
    async index(req, res) {
        try {
            const alunos = await Aluno.find({}); //,['_id']);

            return res.status(200).send({ msg: "Sucesso", dados: alunos });
        } catch (e) {
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async store(req, res) {
        try {
            const { cnh } = req.body;

            let aluno = await Aluno.findOne({ cnh });

            if (!aluno) {
                const { nome, email, nascimento, cidade, celular, rg, cpf, ufcnh, anocnh, sexo, marca, modelo, placa } = req.body;

                aluno = await Aluno.create({ nome, email, cpf, nascimento, cidade, celular, rg, cnh, ufcnh, anocnh, sexo, estado: 'ATIVO', dataestado: Date.now() });
                await Moto.create({ aluno: aluno._id, marca, modelo, placa });

                await AlunoTurmaController.store(aluno._id);

                aluno = await Aluno.findById(aluno._id);

                return res.status(200).json({ msg: "Cadastro realizado.", dados: aluno });
            }

            return res.status(200).json({ msg: "Aluno já cadastrado.", dados: aluno });
        } catch (e) {
            console.log("AlunoController:Store " + e);
            const { cnh } = req.body;
            await Aluno.deleteOne({ cnh });
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async show(req, res) {
        try {
            const { aluno_id } = req.params;
            const aluno = await Aluno.findById({ aluno_id });
            if (!aluno) {
                return res.status(401).json({ msg: 'Aluno não cadastrado.' });
            }
            return res.status(401).json({ msg: "Sucesso", dados: aluno });
        } catch (e) {
            console.log("AlunoController:Show " + e);
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    }
};