// index, show, store, update, destroy
const InscricaoController = require('./InscricaoController');
const TransferenciaController = require('./TransferenciaController');
let path_model = 'model_ppv'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'model_ppv_dev';
}
const {AlunoTurma, Turma, Aluno} = require(path_model);

module.exports = {
    async store(aluno_id) {
        await InscricaoController.store(aluno_id);
    },
    async show(req, res) {
        try {
            const { aluno_id } = req.headers; // contexto da aplicacao
            const aluno = await Aluno.findById(aluno_id);

            if (!aluno) {
                return res.status(400).json({ msg: 'Aluno não cadastrado.' });
            }

            const alunoturma = await AlunoTurma.findOne({ aluno: aluno_id, turma: aluno.turma }).populate("turma");

            if (!alunoturma) {
                // TODO: inscrever aluno?!
                return res.status(400).json({ msg: 'Aluno/Turma não existe para aluno!' });
            }

            return res.status(200).json({msg:"Sucesso", dados:alunoturma});
        } catch (e) {
            console.log("AlunoTurmaController:Show " + e);
            return res.status(400).send({msg:"Erro", dados:e});
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
            msg.push("Erro: "+e);
        }
        return msg;
    }
};