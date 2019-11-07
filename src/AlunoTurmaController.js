// index, show, store, update, destroy
const InscricaoController = require('./InscricaoController');
const TransferenciaController = require('./TransferenciaController');
let path_model = 'react-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'react-model-dev';
}
const { AlunoTurma, Turma, Aluno } = require(path_model);

module.exports = {
    async store(aluno_id) {
        await InscricaoController.store(aluno_id);
    },
    async show(req, res) {
        try {
            if (req.headers.hasOwnProperty('aluno_id')) {
                const { aluno_id } = req.headers;
                const aluno = await Aluno.findById(aluno_id);
                if (!aluno) {
                    return res.status(400).json({ msg: 'Aluno não cadastrado.' });
                }
                if (req.headers.hasOwnProperty('turma_id')) {
                    const { turma_id } = req.headers;
                    const turma = await Turma.findById(turma_id);
                    if (!turma) {
                        return res.status(400).json({ msg: 'Turma não cadastrada.' });
                    }
                    const alunoturma = await AlunoTurma.findOne({ aluno: aluno_id, turma: turma_id });
                    if (!alunoturma) {
                        return res.status(400).json({ msg: 'Aluno/Turma não existe!' });
                    }
                    return res.status(200).json({ msg: "Sucesso", dados: alunoturma });
                }
                const alunoturma = await AlunoTurma.find(
                    {
                        aluno: aluno_id
                    },
                    [], {
                    limit: 1,
                    sort: {
                        createdAt: -1
                    }
                });
                if (!alunoturma) {
                    return res.status(400).json({ msg: 'Aluno/Turma não existe para aluno!' });
                }
                return res.status(200).json({ msg: "Sucesso", dados: alunoturma[0] });
            } else {
                const { turma_id } = req.headers;
                const turma = await Turma.findById(turma_id);
                if (!turma) {
                    return res.status(400).json({ msg: 'Turma não cadastrada.' });
                }
                const alunoturma = await AlunoTurma.find({ turma: turma_id });
                if (!alunoturma) {
                    return res.status(400).json({ msg: 'Aluno/Turma não existe para turma!' });
                }
                return res.status(200).json({ msg: "Sucesso", dados: alunoturma });
            }
        } catch (e) {
            console.log("AlunoTurmaController:Show " + e);
            return res.status(400).send({ msg: "Erro", dados: e });
        }
    },
    async update(turma_id) { // Verifica se existem alunos na fila de espera para ser transferido para a Turma disponível
        let msg = [];
        try {
            const turma_nova = await Turma.findById(turma_id);
            if (!turma_nova) {
                msg.push("Turma nova não existe.");
            }
            const turma_espera = await Turma.findOne({ descricao: "ESPERA" });
            if (!turma_espera) {
                msg.push("Turma de espera não existe");
            }
            const alunos_espera = await AlunoTurma.find(
                {
                    turma: turma_espera._id,
                    createdAt: { $lte: turma_nova.createdAt }
                },
                [],
                {
                    skip: 0,
                    limit: turma_nova.vagas,
                    sort: {
                        createdAt: 1
                    }
                });

            for (var i = 0; i < alunos_espera.length; i++) {
                await TransferenciaController.store(alunos_espera[i].aluno, turma_espera._id, turma_id);
                await AlunoTurma.deleteOne({ aluno: alunos_espera[i].aluno, turma: turma_espera._id });
            }

        } catch (e) {
            msg.push("Erro: " + e);
        }
        return msg;
    }
};