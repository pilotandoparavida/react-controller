// index, show, store, update, destroy
let path_model = 'react-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'react-model-dev';
}
const {Aluno, Turma, AlunoTurma} = require(path_model);

module.exports = {
    async store(req, res) {
        try {
            const { aluno_id, turma_id } = req.headers;

            const aluno = await Aluno.findById(aluno_id);
            if (!aluno) {
                return res.status(400).json({ msg: 'Aluno não cadastrado.' });
            }

            if (!aluno.turma.equals(turma_id)) {
                return res.status(400).json({ msg: 'Aluno inscrito em outra turma.' });
            }

            const turma = await Turma.findById(turma_id);
            if (!turma) {
                return res.status(400).json({ msg: 'Turma não cadastrada.' });
            }

            const alunoturma = await AlunoTurma.findOne({ aluno: aluno_id, turma: turma_id });
            if (alunoturma.confirmar === false 
                    || alunoturma.estado === 'TRANSFERIDO') {
                return res.status(400).json({ msg: "Turma já confirmada, transferida ou não permite aceitar." });
            }

            alunoturma.estado = "CONFIRMADO";
            alunoturma.confirmar = false;
            await alunoturma.save();

            return res.status(200).json({msg:"Sucesso", dados:alunoturma});
        } catch (e) {
            console.log("AceitarInscricaoController:Store " + e);
            return res.status(400).send({msg:"Erro", dados:e});
        }
    }
}