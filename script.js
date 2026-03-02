// script.js
class BuscaCEP {
    constructor() {
        this.ufSelect = document.getElementById('uf');
        this.cidadeSelect = document.getElementById('cidade');
        this.enderecoInput = document.getElementById('endereco');
        this.btnBuscar = document.getElementById('btnBuscar');
        this.form = document.getElementById('cepForm');
        this.resultadoDiv = document.getElementById('resultado');
        this.erroDiv = document.getElementById('erro');
        this.resultadoContent = document.getElementById('resultadoContent');
        
        this.init();
    }

    async init() {
        await this.carregarEstados();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.ufSelect.addEventListener('change', () => this.ufChange());
        this.cidadeSelect.addEventListener('change', () => this.checkFormValidity());
        this.enderecoInput.addEventListener('input', () => this.checkFormValidity());
        this.form.addEventListener('submit', (e) => this.buscarCEP(e));
    }

    async carregarEstados() {
        try {
            const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
            const estados = await response.json();
            
            estados.sort((a, b) => a.nome.localeCompare(b.nome));
            
            estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.sigla;
                option.textContent = `${estado.nome} (${estado.sigla})`;
                this.ufSelect.appendChild(option);
            });
        } catch (error) {
            this.mostrarErro('Erro ao carregar lista de estados. Tente novamente mais tarde.');
        }
    }

    async ufChange() {
        const uf = this.ufSelect.value;
        
        if (!uf) {
            this.cidadeSelect.disabled = true;
            this.cidadeSelect.innerHTML = '<option value="">Primeiro selecione o estado</option>';
            return;
        }

        this.cidadeSelect.disabled = true;
        this.cidadeSelect.innerHTML = '<option value="">Carregando cidades...</option>';

        try {
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const cidades = await response.json();
            
            cidades.sort((a, b) => a.nome.localeCompare(b.nome));
            
            this.cidadeSelect.innerHTML = '<option value="">Selecione a cidade</option>';
            cidades.forEach(cidade => {
                const option = document.createElement('option');
                option.value = cidade.nome;
                option.textContent = cidade.nome;
                this.cidadeSelect.appendChild(option);
            });

            this.cidadeSelect.disabled = false;
        } catch (error) {
            this.mostrarErro('Erro ao carregar lista de cidades. Tente novamente mais tarde.');
            this.cidadeSelect.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        }
    }

    checkFormValidity() {
        const uf = this.ufSelect.value;
        const cidade = this.cidadeSelect.value;
        const endereco = this.enderecoInput.value.trim();
        
        this.btnBuscar.disabled = !(uf && cidade && endereco.length >= 3);
    }

    async buscarCEP(event) {
        event.preventDefault();

        const uf = this.ufSelect.value;
        const cidade = this.cidadeSelect.value;
        const endereco = this.enderecoInput.value.trim();

        this.limparResultados();
        this.mostrarLoading(true);

        try {
            const response = await fetch(`https://viacep.com.br/ws/${uf}/${cidade}/${endereco}/json/`);
            const data = await response.json();

            if (data.erro) {
                throw new Error('Nenhum CEP encontrado para este endereço');
            }

            this.mostrarResultados(data);
        } catch (error) {
            this.mostrarErro(error.message || 'Erro ao buscar CEP. Tente novamente.');
        } finally {
            this.mostrarLoading(false);
        }
    }

    mostrarResultados(resultados) {
        const resultadosArray = Array.isArray(resultados) ? resultados : [resultados];

        let html = `
            <div class="cep-destaque">
                ${resultadosArray.length} ${resultadosArray.length === 1 ? 'CEP encontrado' : 'CEPs encontrados'}
            </div>
        `;

        resultadosArray.forEach(item => {
            html += `
                <div class="info-grid">
                    <div class="info-item">
                        <strong>CEP</strong>
                        <span>${this.formatarCEP(item.cep)}</span>
                    </div>
                    <div class="info-item">
                        <strong>Logradouro</strong>
                        <span>${item.logradouro || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Complemento</strong>
                        <span>${item.complemento || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Bairro</strong>
                        <span>${item.bairro || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <strong>Cidade/UF</strong>
                        <span>${item.localidade} - ${item.uf}</span>
                    </div>
                    <div class="info-item">
                        <strong>IBGE</strong>
                        <span>${item.ibge || 'Não informado'}</span>
                    </div>
                </div>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
            `;
        });

        this.resultadoContent.innerHTML = html;
        this.resultadoDiv.style.display = 'block';
        this.erroDiv.style.display = 'none';
    }

    formatarCEP(cep) {
        return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
    }

    mostrarErro(mensagem) {
        this.erroDiv.textContent = mensagem;
        this.erroDiv.style.display = 'block';
        this.resultadoDiv.style.display = 'none';
    }

    mostrarLoading(mostrar) {
        const btnTexto = this.btnBuscar.querySelector('span:first-child');
        const btnLoading = this.btnBuscar.querySelector('.loading');
        
        if (mostrar) {
            btnTexto.style.display = 'none';
            btnLoading.style.display = 'inline-block';
            this.btnBuscar.disabled = true;
        } else {
            btnTexto.style.display = 'inline';
            btnLoading.style.display = 'none';
            this.checkFormValidity();
        }
    }

    limparResultados() {
        this.resultadoDiv.style.display = 'none';
        this.erroDiv.style.display = 'none';
        this.resultadoContent.innerHTML = '';
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new BuscaCEP();
});
