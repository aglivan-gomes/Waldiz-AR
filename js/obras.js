/*
  arquivo de configuracao com a lista das obras, suas coordenadas geograficas,
  os caminhos dos arquivos de audio e os textos descritivos exibidos no hud.
*/

export const OBRAS = [
    {
        nome: 'Casa da Fazenda',
        modelo: '#glb-casa-fazenda',
        latitude: -4.971222,
        longitude: -39.016225,
        audio: 'assets/audio/audio-teste.mp3',
        descricao: 'Lorem ipsum dolor sit amet, texto provisorio da Casa da Fazenda para testar a caixa de dialogo sem cobrir a visualizacao do modelo 3d na camera.'
    },
    {
        nome: 'Hotel NSF',
        modelo: '#glb-hotel-nsf',
        latitude: null, // substituir pela coordenada real quando disponivel
        longitude: null,
        audio: 'assets/audio/audio-teste.mp3',
        descricao: 'Lorem ipsum dolor sit amet, texto provisorio do Hotel NSF para validacao do painel de leitura e disparo do audio narrado.'
    },
    {
        nome: 'Prefeitura Antiga',
        modelo: '#glb-prefeitura-antiga',
        latitude: null, // substituir pela coordenada real quando disponivel
        longitude: null,
        audio: 'assets/audio/audio-teste.mp3',
        descricao: 'Lorem ipsum dolor sit amet, texto provisorio da Prefeitura Antiga para testar o limite de distancia de cinquenta metros.'
    }
];