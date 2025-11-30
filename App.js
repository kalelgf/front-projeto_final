import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';

// ============================================
// CONFIGURAÇÃO: Insira seu IP local aqui
// ============================================
const API_BASE_URL = 'http://10.156.132.126:8000';
// ============================================

export default function App() {
  // Estados para monitoramento
  const [distanciaAtual, setDistanciaAtual] = useState(null);
  const [historicoDistancias, setHistoricoDistancias] = useState([]);
  const [loadingDistancias, setLoadingDistancias] = useState(true);
  
  // Estados para configuração de limite
  const [limiteAtual, setLimiteAtual] = useState('');
  const [novoLimite, setNovoLimite] = useState('');
  const [loadingLimite, setLoadingLimite] = useState(true);
  const [salvandoLimite, setSalvandoLimite] = useState(false);
  
  // Estados gerais
  const [erro, setErro] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // FUNÇÃO: Buscar leituras de distância
  // ============================================
  const buscarDistancias = async () => {
    try {
      console.log('Buscando distâncias em:', `${API_BASE_URL}/logging/distancias`);
      const response = await fetch(`${API_BASE_URL}/logging/distancias`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status da resposta:', response.status);
      console.log('Headers:', response.headers);
      
      if (response.status === 404) {
        setErro('Endpoint /logging/distancias não encontrado no backend');
        return;
      }
      
      if (response.status === 501) {
        setErro('⚠️ Arduino desconectado - Aguardando leituras do sensor');
        setLoadingDistancias(false);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        setErro(`Backend retornou erro ${response.status}`);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        setErro('Backend não retornou JSON válido');
        return;
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        setDistanciaAtual(data[data.length-1]); // Última leitura
        setHistoricoDistancias(data);
        setErro(null); // Limpa qualquer erro anterior
        console.log('✅ Dados carregados com sucesso!');
      } else if (data && !Array.isArray(data)) {
        // Se retornou objeto único ao invés de array
        setDistanciaAtual(data);
        setHistoricoDistancias([data]);
        setErro(null);
      } else {
        setErro('Backend não retornou leituras');
      }
    } catch (error) {
      console.error('Erro ao buscar distâncias:', error);
      setErro(`Erro: ${error.message}`);
    } finally {
      setLoadingDistancias(false);
    }
  };

  // ============================================
  // FUNÇÃO: Buscar limite atual
  // ============================================
  const buscarLimite = async () => {
    try {
      console.log('Buscando limite em:', `${API_BASE_URL}/controle/limite`);
      const response = await fetch(`${API_BASE_URL}/controle/limite`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status limite:', response.status);
      
      if (response.status === 404) {
        setErro('Endpoint /controle/limite não encontrado');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro ${response.status}:`, errorText);
        return;
      }
      
      const data = await response.json();
      console.log('Limite recebido:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        const limite = data[0].limite.toString();
        setLimiteAtual(limite);
        setNovoLimite(limite);
        setErro(null);
      } else if (data && data.limite !== undefined) {
        // Se retornou objeto único
        const limite = data.limite.toString();
        setLimiteAtual(limite);
        setNovoLimite(limite);
        setErro(null);
      }
    } catch (error) {
      console.error('Erro ao buscar limite:', error);
    } finally {
      setLoadingLimite(false);
    }
  };

  // ============================================
  // FUNÇÃO: Salvar novo limite
  // ============================================
  const salvarLimite = async () => {
    if (!novoLimite || isNaN(novoLimite)) {
      Alert.alert('Erro', 'Por favor, insira um valor numérico válido');
      return;
    }

    setSalvandoLimite(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/controle/limite`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limite: parseInt(novoLimite),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar limite');
      }
      
      setLimiteAtual(novoLimite);
      Alert.alert('Sucesso', 'Limite salvo com sucesso!');
      setErro(null);
    } catch (error) {
      console.error('Erro ao salvar limite:', error);
      Alert.alert('Erro', 'Não foi possível salvar o limite');
    } finally {
      setSalvandoLimite(false);
    }
  };

  // ============================================
  // FUNÇÃO: Atualizar dados (pull to refresh)
  // ============================================
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([buscarDistancias(), buscarLimite()]);
    setRefreshing(false);
  };

  // ============================================
  // EFFECT: Carregar dados iniciais
  // ============================================
  useEffect(() => {
    buscarDistancias();
    buscarLimite();
  }, []);

  // ============================================
  // EFFECT: Polling de distâncias (a cada 3s)
  // ============================================
  useEffect(() => {
    const intervalo = setInterval(() => {
      buscarDistancias();
    }, 3000);

    return () => clearInterval(intervalo);
  }, []);

  // ============================================
  // FUNÇÃO: Formatar data/hora
  // ============================================
  const formatarDataHora = (dataHoraString) => {
    try {
      const data = new Date(dataHoraString);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dataHoraString;
    }
  };

  // ============================================
  // RENDER: Item do histórico
  // ============================================
  const renderItemHistorico = ({ item, index }) => (
    <View style={styles.itemHistorico}>
      <View style={styles.itemHistoricoHeader}>
        <Text style={styles.itemHistoricoNumero}>#{item.id}</Text>
        <Text style={styles.itemHistoricoDistancia}>{item.distancia} cm</Text>
      </View>
      <Text style={styles.itemHistoricoData}>
        {formatarDataHora(item.dataHoraLeitura)}
      </Text>
    </View>
  );

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Painel IoT</Text>
        <Text style={styles.headerSubtitle}>Dashboard de Controle</Text>
      </View>

      {/* MENSAGEM DE ERRO GLOBAL */}
      {erro && (
        <View style={styles.erroContainer}>
          <Text style={styles.erroTexto}>⚠️ {erro}</Text>
        </View>
      )}

      {/* CARD: MONITORAMENTO DE DISTÂNCIA */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📡 Monitoramento de Sensor</Text>
        
        {loadingDistancias && !distanciaAtual ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        ) : distanciaAtual ? (
          <>
            {/* Leitura Atual */}
            <View style={styles.leituraAtualContainer}>
              <Text style={styles.leituraAtualLabel}>Distância Atual</Text>
              <Text style={styles.leituraAtualValor}>
                {distanciaAtual.distancia} <Text style={styles.unidade}>cm</Text>
              </Text>
              <Text style={styles.leituraAtualData}>
                {formatarDataHora(distanciaAtual.dataHoraLeitura)}
              </Text>
            </View>

            {/* Histórico */}
            <View style={styles.historicoContainer}>
              <Text style={styles.historicoTitle}>Histórico (últimas 10 leituras)</Text>
              <FlatList
                data={historicoDistancias}
                renderItem={renderItemHistorico}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.historicoLista}
              />
            </View>
          </>
        ) : (
          <View style={styles.semDadosContainer}>
            <Text style={styles.semDadosIcone}>🔌</Text>
            <Text style={styles.semDadosTitulo}>Arduino Desconectado</Text>
            <Text style={styles.semDadosTexto}>
              Conecte o Arduino e aguarde o envio de leituras do sensor de distância.
            </Text>
          </View>
        )}
      </View>

      {/* CARD: CONFIGURAÇÃO DE LIMITE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Configuração de Limite</Text>
        
        {loadingLimite && !limiteAtual ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
        ) : (
          <>
            {/* Limite Atual */}
            <View style={styles.limiteAtualContainer}>
              <Text style={styles.limiteAtualLabel}>Limite Atual:</Text>
              <Text style={styles.limiteAtualValor}>{limiteAtual} cm</Text>
            </View>

            {/* Input para Novo Limite */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Novo Limite (cm):</Text>
              <TextInput
                style={styles.input}
                value={novoLimite}
                onChangeText={setNovoLimite}
                keyboardType="numeric"
                placeholder="Ex: 50"
                placeholderTextColor="#999"
              />
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[styles.botaoSalvar, salvandoLimite && styles.botaoDesabilitado]}
              onPress={salvarLimite}
              disabled={salvandoLimite}
            >
              {salvandoLimite ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.botaoSalvarTexto}>Salvar Limite</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerTexto}>
          Sistema IoT • Desenvolvido com React Native
        </Text>
      </View>
    </ScrollView>
  );
}

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F4FF',
  },
  erroContainer: {
    backgroundColor: '#FFE5E5',
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
    padding: 15,
    margin: 15,
    borderRadius: 8,
  },
  erroTexto: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 30,
  },
  semDadosContainer: {
    alignItems: 'center',
    padding: 40,
  },
  semDadosIcone: {
    fontSize: 48,
    marginBottom: 15,
  },
  semDadosTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginBottom: 10,
  },
  semDadosTexto: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Estilos: Leitura Atual
  leituraAtualContainer: {
    backgroundColor: '#E8F4FF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  leituraAtualLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  leituraAtualValor: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  unidade: {
    fontSize: 24,
    fontWeight: 'normal',
  },
  leituraAtualData: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 5,
  },
  
  // Estilos: Histórico
  historicoContainer: {
    marginTop: 10,
  },
  historicoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 10,
  },
  historicoLista: {
    paddingTop: 5,
  },
  itemHistorico: {
    backgroundColor: '#F8FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  itemHistoricoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemHistoricoNumero: {
    fontSize: 12,
    color: '#95A5A6',
    fontWeight: '600',
  },
  itemHistoricoDistancia: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  itemHistoricoData: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  
  // Estilos: Configuração de Limite
  limiteAtualContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  limiteAtualLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  limiteAtualValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F39C12',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFB',
    borderWidth: 1,
    borderColor: '#E0E6ED',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
  },
  botaoSalvar: {
    backgroundColor: '#27AE60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  botaoDesabilitado: {
    backgroundColor: '#95A5A6',
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Estilos: Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerTexto: {
    fontSize: 12,
    color: '#95A5A6',
  },
});
