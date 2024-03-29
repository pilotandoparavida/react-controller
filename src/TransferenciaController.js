// index, show, store, update, destroy
let path_model = 'react-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'react-model-dev';
}
const {Turma, Aluno, AlunoTurma} = require(path_model);

module.exports = {
    /*
        Transfere o aluno de uma turma para a próxima disponível.
    */
    async store(aluno_id, turma_id, turma_new) {
        let turma;
        let confirmar = true;

        const aluno = await Aluno.findById(aluno_id);
        if (!aluno) {
            return null;
        }

        if (!aluno.turma.equals(turma_id)) {
            return null;
        }

        if (turma_new) { // Transferir da lista de espera
            const t_espera = await Turma.findById(turma_id);
            if (!t_espera) {
                return null;
            }
            if (t_espera.descricao !== "ESPERA") {
                return null;
            }
            t_espera.totalinscritos -= 1;
            await t_espera.save();

            turma = await Turma.findById(turma_new);
            if (!turma) {
                return null;
            }
        } else { // transferindo da turma atual para uma outra distante
            const t_atual = await Turma.findById(turma_id);
            if (!t_atual) {
                return null;
            }
            // t_atual.insc já foi subtraido na chamada anterior
            const turmas = await Turma.find({
                data: { $gt: t_atual.data },
                datainscricao: { $gte: new Date()},
            },
                [], {
                sort: {
                    data: 1
                }
            });
            turma = turmas[0];
            for (var i = 0, len = turmas.length; i < len; ++i) {
                if (turmas[i].vagas > turmas[i].totalinscritos) {
                    turma = turmas[i];
                    break;
                }
            }      
            
            if (turma.descricao === "ESPERA") {
                confirmar = false;
            }
        }

        turma.totalinscritos += 1;
        await turma.save();

        aluno.turma = turma._id;
        await aluno.save();

        const alunoTurma =  await AlunoTurma.create({ aluno: aluno_id, turma: turma._id, estado: "INSCRITO", confirmar });
        
        return alunoTurma;
    }
};