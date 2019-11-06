// index, show, store, update, destroy
let path_model = 'react-model'
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    path_model = 'reac-model-dev';
}
const {Aluno} = require(path_model);

module.exports = {
    async show(req, res) {
        try {
            const { cnh, nascimento } = req.headers;
            const aluno = await Aluno.findOne({ cnh });
            if (!aluno) {
                return res.status(401).json({ msg: 'CNH não cadastrada.' });
            }
            if (aluno.nascimento === nascimento) {
                return res.status(200).json({msg:"Sucesso", dados:aluno});
            }
            return res.status(401).json({ error: 'Data de nascimento incorreta.' });
        } catch (e) {
            console.log("AlunoController:Show " + e);
            return res.status(400).send({msg:"Erro", dados:e});
        }
    }
};