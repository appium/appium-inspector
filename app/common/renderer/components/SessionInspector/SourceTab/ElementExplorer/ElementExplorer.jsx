import {IconFocus2, IconRefresh} from '@tabler/icons-react';
import {Alert, Button, Modal, Space, Spin, Table, Tag, Tooltip, Typography} from 'antd';
import {useEffect, useRef, useState} from 'react';

import {NATIVE_APP} from '../../../../constants/session-inspector.js';
import {createElementAnalysisClient} from '../../../../embedded/element-explorer-client.js';
import {buildElementCatalog} from '../../../../utils/locator-generation/element-explorer.js';
import {
  analysisNodes,
  elementCandidates,
  explorerSelectionContext,
  isExplorerSelectionCurrent,
  nodePreviewRect,
} from './element-explorer-view.js';

import styles from './ElementExplorer.module.css';

const {Text, Paragraph} = Typography;
const idleAnalysis = {status: 'idle', phase: '', processed: 0, total: 0};

export function ElementExplorerModal(props) {
  const {screenshot, windowSize, methodCallInProgress, verifyExplorerLocator, onClose} = props;
  const {current: capture} = useRef({
    ...explorerSelectionContext(props),
    screenshot,
    windowSize,
  });
  const [snapshot, setSnapshot] = useState(null);
  const [captureError, setCaptureError] = useState('');
  const [invalidated, setInvalidated] = useState(false);
  const [analysisAttempt, setAnalysisAttempt] = useState(0);
  const [analysis, setAnalysis] = useState(idleAnalysis);
  const [recommendation, setRecommendation] = useState(null);
  const [locatorContracts, setLocatorContracts] = useState({});
  const [candidateId, setCandidateId] = useState(null);
  const [verification, setVerification] = useState(null);
  const [sending, setSending] = useState(false);
  const clientRef = useRef(null);
  const operationRef = useRef(0);
  const invalidatedRef = useRef(false);
  const currentRef = useRef(null);
  currentRef.current = explorerSelectionContext(props);
  const changed = invalidated || !isExplorerSelectionCurrent(capture, currentRef.current);
  const stale = !snapshot || changed;
  if (changed) {
    invalidatedRef.current = true;
  }
  useEffect(() => {
    if (changed) {
      setInvalidated(true);
    }
  }, [changed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (capture.context !== NATIVE_APP || !['android', 'ios'].includes(capture.platform)) {
          throw new Error('Selecciona un elemento en el contexto nativo Android o iOS del Inspector.');
        }
        if (capture.sourceError || !capture.sourceXml || !capture.sessionId) {
          throw new Error(
            'No hay una captura válida. Actualiza la pantalla en el Inspector y vuelve a abrir el elemento.',
          );
        }
        const catalog = buildElementCatalog(capture.sourceXml, true, capture.automationName);
        const node = catalog.nodes.find((entry) => entry.nodeId === capture.targetNodeId);
        if (typeof capture.targetNodeId !== 'string' || !node) {
          throw new Error('Selecciona un elemento en el árbol XML del Inspector y vuelve a abrir el explorador.');
        }
        setSnapshot({
          ...capture,
          snapshotId: crypto.randomUUID(),
          catalog,
          node,
          capturedAt: new Date().toLocaleTimeString(),
        });
      } catch (error) {
        setCaptureError(error.message);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [capture]);

  // Opening the modal is the explicit request to analyze its fixed Inspector selection.
  useEffect(() => {
    if (!snapshot) {
      return;
    }
    operationRef.current++;
    setVerification(null);
    setSending(false);
    setRecommendation(null);
    setLocatorContracts({});
    setCandidateId(snapshot.node.candidates.find((entry) => entry.unique === true)?.id ?? null);
    if (changed) {
      setAnalysis({...idleAnalysis, status: 'cancelled', phase: 'La selección o la captura cambió.'});
      return;
    }
    const operationCounter = operationRef;
    let disposed = false;
    const isCurrent = () =>
      !disposed && !invalidatedRef.current && isExplorerSelectionCurrent(capture, currentRef.current);
    setAnalysis({status: 'running', phase: 'Analizando el elemento seleccionado', processed: 0, total: 1});
    let client;
    try {
      client = createElementAnalysisClient({
        onUpdate(update) {
          if (!isCurrent()) {
            return;
          }
          setAnalysis(update);
          if (update.locatorContracts) {
            setLocatorContracts((previous) => ({
              ...previous,
              ...Object.fromEntries(update.locatorContracts.map((entry) => [entry.candidateId, entry])),
            }));
          }
          const result = update.results?.find((entry) => entry.nodeId === snapshot.targetNodeId);
          if (result) {
            operationRef.current++;
            setVerification(null);
            setSending(false);
            setRecommendation(result);
          }
        },
      });
      clientRef.current = client;
      client.start({
        snapshotId: snapshot.snapshotId,
        targetNodeId: snapshot.targetNodeId,
        sessionId: snapshot.sessionId,
        platform: snapshot.platform,
        context: snapshot.context,
        sourceXml: snapshot.sourceXml,
        nodes: analysisNodes(snapshot.catalog),
      });
    } catch (error) {
      setAnalysis({
        status: 'error',
        phase: 'No se pudo analizar este elemento',
        error: error.message,
        processed: 0,
        total: 1,
      });
    }
    return () => {
      disposed = true;
      operationCounter.current++;
      client?.dispose();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [snapshot, capture, changed, analysisAttempt]);

  const node = snapshot?.node;
  const allCandidates = elementCandidates(node, recommendation?.proposals);
  const candidates = allCandidates.filter((entry) => entry.unique === true);
  const candidate = candidates.find((entry) => entry.id === candidateId);
  const candidateContract = candidate ? locatorContracts[candidate.id] : undefined;
  const previewRect = nodePreviewRect(node, snapshot?.windowSize);
  const analysisRunning = analysis.status === 'running';

  const handleSelectCandidate = (nextId) => {
    operationRef.current++;
    setCandidateId(nextId);
    setVerification(null);
    setSending(false);
  };
  const handleCancelAnalysis = () => {
    clientRef.current?.dispose();
    clientRef.current = null;
    setAnalysis((previous) => ({...previous, status: 'cancelled', phase: 'Análisis cancelado'}));
  };
  const handleClose = () => {
    operationRef.current++;
    clientRef.current?.dispose();
    clientRef.current = null;
    onClose();
  };
  const handleVerify = async (transfer) => {
    if (
      stale ||
      !node ||
      candidate?.unique !== true ||
      sending ||
      methodCallInProgress ||
      (transfer && candidateContract?.compatible === false)
    ) {
      return;
    }
    const operation = ++operationRef.current;
    const isCurrent = () =>
      operationRef.current === operation &&
      !invalidatedRef.current &&
      isExplorerSelectionCurrent(capture, currentRef.current);
    setSending(true);
    setVerification({type: 'info', message: 'Verificando identidad y coincidencia única contra Appium…'});
    try {
      await verifyExplorerLocator(node, candidate, snapshot, {isCurrent, transfer});
      if (!isCurrent()) {
        return;
      }
      setVerification({
        type: 'success',
        candidateId: candidate.id,
        message: transfer
          ? 'Selector enviado para revalidación en el Recorder.'
          : 'Verificado en Appium: una coincidencia y el mismo elemento.',
      });
      if (transfer) {
        handleClose();
      }
    } catch (error) {
      if (isCurrent()) {
        setVerification({type: 'error', message: error.message});
      }
    } finally {
      if (isCurrent()) {
        setSending(false);
      }
    }
  };
  const columns = [
    {
      title: 'Estrategia, locator y motivo',
      key: 'selector',
      render: (_, entry) => {
        const contract = locatorContracts[entry.id];
        return (
          <div className={styles.candidate}>
            <Space wrap>
              <Text strong>{entry.strategy}</Text>
              {entry.xpathStrategy && <Tag>{entry.xpathStrategy}</Tag>}
            </Space>
            <Paragraph className={styles.selector} copyable={{text: entry.selector}}>
              {entry.selector}
            </Paragraph>
            <Text type="secondary">{entry.reason}</Text>
            <div className={styles.frameworkContract}>
              {contract?.compatible ? (
                <>
                  <Text code>{'TypeLocator.' + contract.locatorType}</Text>
                  <Paragraph className={styles.selector} copyable={{text: contract.locatorValue}}>
                    {contract.locatorValue}
                  </Paragraph>
                </>
              ) : (
                <Text type={contract?.compatible === false ? 'warning' : 'secondary'}>
                  {contract?.reason || 'El Recorder comprobará TypeLocator y valor al usar el selector.'}
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Evidencia',
      key: 'evidence',
      width: 170,
      render: (_, entry) => (
        <Space orientation="vertical" size={4}>
          <Tag color="cyan">Único en XML</Tag>
          {verification?.type === 'success' && verification.candidateId === entry.id ? (
            <Tag color="green">Verificado en Appium</Tag>
          ) : (
            <Tag>Pendiente de Appium</Tag>
          )}
          {entry.origin === 'agent' && <Tag color="purple">Propuesta del agente</Tag>}
          {entry.structural && <Tag color="orange">Estructural · frágil</Tag>}
          {recommendation?.recommendedCandidateId === entry.id && <Tag color="purple">Sugerido por agente</Tag>}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open
      title="Explorar elemento seleccionado"
      width="min(1100px, 96vw)"
      onCancel={handleClose}
      footer={
        <Space wrap>
          <Button onClick={handleClose}>Cerrar</Button>
          <Button disabled={stale || !candidate || sending || methodCallInProgress} onClick={() => handleVerify(false)}>
            Verificar selector
          </Button>
          <Button
            type="primary"
            loading={sending}
            disabled={stale || !candidate || sending || methodCallInProgress || candidateContract?.compatible === false}
            onClick={() => handleVerify(true)}
          >
            Usar en Recorder
          </Button>
        </Space>
      }
    >
      <div className={styles.toolbar}>
        <Text strong>
          {capture.platform.toUpperCase()} · {capture.context}
        </Text>
        {snapshot && <Text type="secondary">Captura {snapshot.capturedAt}</Text>}
      </div>
      {changed && (
        <Alert
          type="warning"
          showIcon
          title="La selección o la captura del Inspector cambió"
          description="Cierra este panel y vuelve a explorar el elemento seleccionado. Los resultados anteriores ya no se pueden usar."
        />
      )}
      {captureError && <Alert type="warning" showIcon title={captureError} />}
      {!snapshot && !captureError && (
        <div className={styles.loading}>
          <Spin /> Preparando los locators del elemento…
        </div>
      )}
      {node && (
        <>
          <div className={styles.analysis} role="status" aria-live="polite">
            <Space wrap>
              {analysisRunning && !changed && <Spin size="small" />}
              <Text>{analysis.phase || 'Locators locales disponibles'}</Text>
              {analysis.total > 0 && (
                <Text type="secondary">
                  {analysis.processed} / {analysis.total} elemento
                </Text>
              )}
              {analysis.model && <Text type="secondary">{analysis.model}</Text>}
            </Space>
            {analysisRunning && !changed ? (
              <Button size="small" onClick={handleCancelAnalysis}>
                Cancelar análisis
              </Button>
            ) : (
              <Tooltip title="Analiza nuevamente este mismo elemento usando el XML de la captura como contexto.">
                <Button
                  icon={<IconRefresh size={16} />}
                  disabled={stale || sending || methodCallInProgress}
                  onClick={() => setAnalysisAttempt((value) => value + 1)}
                >
                  Volver a analizar
                </Button>
              </Tooltip>
            )}
          </div>
          {analysis.status === 'error' && (
            <Alert
              type="warning"
              showIcon
              title="Los locators locales siguen disponibles"
              description={
                analysis.error ||
                'El agente no pudo completar el análisis. Puedes continuar con los locators únicos del XML.'
              }
            />
          )}
          <section className={styles.details} aria-label="Detalle del elemento">
            <div className={styles.elementHeader}>
              {snapshot.screenshot && (
                <div className={styles.preview}>
                  <img src={'data:image/png;base64,' + snapshot.screenshot} alt="Captura del elemento seleccionado" />
                  {previewRect && <span className={styles.previewRect} style={previewRect} />}
                </div>
              )}
              <div className={styles.elementInfo}>
                <Space wrap>
                  <Text strong>{node.label || node.tag}</Text>
                  <Tag>{node.tag}</Tag>
                </Space>
                <Text type="secondary">
                  Elemento elegido en el árbol XML del Inspector. Para explorar otro, cierra este panel y selecciónalo
                  allí.
                </Text>
                <details className={styles.attributes}>
                  <summary>Atributos del XML ({Object.keys(node.attributes).length})</summary>
                  <dl>
                    {Object.entries(node.attributes).map(([name, value]) => (
                      <div key={name}>
                        <dt>{name}</dt>
                        <dd>{value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              </div>
            </div>
            {recommendation && (
              <Alert
                type="info"
                showIcon
                title={'Nombre sugerido: ' + recommendation.suggestedName}
                description={recommendation.reason}
              />
            )}
            {recommendation?.warnings?.length > 0 && (
              <Alert
                type="warning"
                showIcon
                title="Observaciones del análisis"
                description={
                  <ul>
                    {[...new Set(recommendation.warnings)].map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                }
              />
            )}
            <Text type="secondary">
              {candidates.length} locators únicos en esta captura. «Usar en Recorder» verifica además la coincidencia y
              la identidad en Appium.
              {allCandidates.length > candidates.length &&
                ' Se omitieron los candidatos ambiguos o cuya unicidad no está comprobada.'}
            </Text>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={candidates}
              columns={columns}
              scroll={{y: 350}}
              locale={{emptyText: 'No hay locators únicos comprobados en el XML para este elemento.'}}
              rowSelection={{
                type: 'radio',
                selectedRowKeys: candidateId === null ? [] : [candidateId],
                onChange: (keys) => handleSelectCandidate(keys[0]),
              }}
              onRow={(entry) => ({onClick: () => handleSelectCandidate(entry.id)})}
            />
          </section>
          {verification && !changed && <Alert showIcon type={verification.type} title={verification.message} />}
        </>
      )}
    </Modal>
  );
}

export default function ElementExplorer(props) {
  const [open, setOpen] = useState(false);
  const selected = typeof props.selectedElement?.path === 'string';
  const disabled = !selected || !props.sourceXML || Boolean(props.sourceError);
  const reason = !selected
    ? 'Selecciona primero un elemento en el árbol XML del Inspector.'
    : !props.sourceXML || props.sourceError
      ? 'Actualiza la captura del Inspector antes de explorar el elemento.'
      : 'Obtén locators únicos y propuestas para el elemento seleccionado.';
  return (
    <>
      <Tooltip title={reason}>
        <span className={styles.launcher}>
          <Button
            id="btnExploreElements"
            className={styles.launchButton}
            icon={<IconFocus2 size={16} />}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            Explorar elemento seleccionado
          </Button>
        </span>
      </Tooltip>
      {open && <ElementExplorerModal {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
