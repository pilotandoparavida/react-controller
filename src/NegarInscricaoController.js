// index, show, store, update, destroy
const AlunoTurmaController = require('./AlunoTurmaController');
const TransferenciaController = require('./TransferenciaController');
let path_model = 'model_ppv'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'model_ppv_dev';
}
const {AlunoTurma, Turma, Aluno, Moto} = require(path_model);

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

            const alunoturma = await AlunoTurma.findOne({ 
                                                aluno: aluno_id, 
                                                turma: turma_id });
            if (alunoturma.confirmar === false 
                || alunoturma.estado === 'TRANSFERIDO') {
                return res.status(400).json({ msg: "Turma já transferida, confirmada ou não permite transferir." });
            }

            const alunosturma = await AlunoTurma.find({ aluno: aluno_id });
            let flagT = false; // para saber se o aluno ja foi transferido
            let flagC = false; // para saber se o aluno já concluiu turma
            for (var i = 0, len = alunosturma.length; i < len; ++i) {
                if (alunosturma[i].estado === 'TRANSFERIDO') {
                    flagT = true;
                }
                if (alunosturma[i].estado === 'CONCLUIDO') {
                    flagC = true;
                }
            }
            if (flagT && !flagC) { 
                // aluno já foi transferido! Sem permissão para trocar de turma! Somente remover se o aluno for novo! Para permitir que ele faça um novo cadastro.  
                await Moto.deleteMany({ aluno: aluno_id });
                await AlunoTurma.deleteMany({ aluno: aluno_id });
                await Aluno.deleteOne({ "_id": aluno_id }); 

                turma.totalinscritos -= 1;
                await turma.save();

                const msg_tc = await AlunoTurmaController.update(turma._id);

                return res.status(210).json({ msg: ['Aluno removido do sistema', msg_tc] });
            } else if (!flagT && !flagC) { 
                // aluno não foi tranferido! Tranferir!
                const alunoturmaT = await TransferenciaController.store(aluno_id, turma_id, false);
                if (alunoturmaT) {
                    alunoturma.estado = "TRANSFERIDO"; 
                    alunoturma.confirmar = false;
                    await alunoturma.save();

                    turma.totalinscritos -= 1;
                    await turma.save();

                    const msg_tc = await AlunoTurmaController.update(turma._id);

                    return res.status(200).json({ 
                                msg: ['Aluno transferido.', msg_tc], 
                                dados: alunoturmaT });
                }
                
                return res.status(400).send({msg:"Erro na transferência de aluno."});
            } else {
                // TODO: o que fazer com o aluno que está fazendo pela segunda vez? Deixar ele cair na opção acima?!
                // TODO: Mostrar turma que ele concluiu?
                const alunoturma_c = await AlunoTurma.find({ 
                            aluno: aluno_id ,
                            estado: "CONCLUIDO"}, 
                            [], {
                                    limit: 1,
                                    sort: {
                                        createdAt: -1
                                    }
                                }).populate('turma');

                aluno.turma = alunoturma_c.turma;
                await aluno.save();

                turma.totalinscritos -= 1;
                await turma.save();

                const msg_tc = await AlunoTurmaController.update(turma._id);

                return res.status(220).json({ 
                        msg: ['Aluno não tem permissao para transferir, já concluiu o curso uma vez.', msg_tc], 
                        dados: alunoturma_c });
            }

        } catch (e) {
            console.log("NegarInscricaoController:Store " + e);
            return res.status(400).send({msg:"Erro", dados:e});
        }
    }
}