import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Spin, 
  Alert, 
  Select, 
  Row, 
  Col, 
  Card, 
  Typography, 
  Layout, 
  Space,
  Statistic,
  notification
} from "antd";
import {
  EditOutlined,
  SyncOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  FilterOutlined,
  ReloadOutlined,
  PlusCircleOutlined,
  DashboardOutlined,
  BarChartOutlined,
  RocketOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleTwoTone,
  FileTextOutlined,
  ToolOutlined,
  LineChartOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Header, Content } = Layout;
const { Option } = Select;
const { Title, Text } = Typography;
const { Item } = Form;

// Tableau des noms de mois en allemand
const monthNames = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const AppWasserMonat = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [addingRecord, setAddingRecord] = useState(false);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loadingAktualisieren, setLoadingAktualisieren] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const openSuccessNotification = useCallback((message, description) => {
    api.success({
      message: message,
      description: description,
      icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
      placement: 'topRight',
      duration: 4.5,
      style: {
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
      }
    });
  }, [api]);

  // Utilisation de useCallback pour mémoriser la fonction fetchData
  const fetchData = useCallback(async () => {
    try {
      setLoadingAktualisieren(true);
      const res = await axios.get("http://48.209.33.37:5009/api/wassermonat");
      const allData = res.data;
      
      const dataWithMonthNames = allData.map(item => ({
        ...item,
        Monatname: monthNames[item.Monat - 1] || `Monat ${item.Monat}`
      }));
      
      setData(dataWithMonthNames);

      const uniqueYears = [...new Set(allData.map((d) => d.Jahr))].sort();
      const uniqueMonths = [...new Set(allData.map((d) => d.Monat))]
        .sort((a, b) => a - b)
        .map(monthNum => ({
          value: monthNum,
          label: monthNames[monthNum - 1] || `Monat ${monthNum}`
        }));
        
      setYears(uniqueYears);
      setMonths(uniqueMonths);

      const latestYear = Math.max(...uniqueYears);
      setSelectedYear(latestYear);
      filterData(dataWithMonthNames, latestYear, null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAktualisieren(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterData = (allData, year, month) => {
    let yearData = allData.filter((d) => d.Jahr === year);
    if (month) yearData = yearData.filter((d) => d.Monat === month);
    yearData.sort((a, b) => a.Monat - b.Monat);

    const sumRow = {
      key: "sum",
      Jahr: "Summe",
      Monat: "",
      Monatname: "",
      "Wasser-Zählerstand": yearData.reduce(
        (acc, curr) => acc + (curr["Wasser-Zählerstand"] || 0),
        0
      ),
      Wasserverbrauch: yearData.reduce(
        (acc, curr) => acc + (curr.Wasserverbrauch || 0),
        0
      ),
    };

    setFilteredData([...yearData, sumRow]);
  };

  const handleFilter = () => filterData(data, selectedYear, selectedMonth);

  const resetFilter = () => {
    const latestYear = Math.max(...years);
    setSelectedYear(latestYear);
    setSelectedMonth(null);
    filterData(data, latestYear, null);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await axios.put(
        `http://48.209.33.37:5009/api/wassermonat/${editingRecord.WasserMonatID}`,
        values
      );
      setEditingRecord(null);
      setSaving(false);
      fetchData();
      openSuccessNotification(
        "Daten erfolgreich aktualisiert",
        `Die Änderungen für ${monthNames[editingRecord.Monat - 1]} ${editingRecord.Jahr} wurden erfolgreich gespeichert.`
      );
    } catch (err) {
      console.error(err);
      openSuccessNotification(
        "Fehler beim Speichern",
        "Die Änderungen konnten nicht gespeichert werden.",
        "error"
      );
    }
  };

  // Ajouter un nouveau record
  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setSaving(true);
      await axios.post("http://48.209.33.37:5009/api/wassermonat", values);
      setAddingRecord(false);
      setSaving(false);
      fetchData();
      openSuccessNotification(
        "Neue Werte erfolgreich hinzugefügt",
        `Die Daten für ${monthNames[values.Monat - 1]} ${values.Jahr} wurden erfolgreich im System hinzugefügt.`
      );
      addForm.resetFields();
    } catch (err) {
      console.error(err);
      openSuccessNotification(
        "Fehler beim Hinzufügen",
        "Die Daten konnten nicht hinzugefügt werden.",
        "error"
      );
    }
  };

  // --- KPI Dashboard Data ---
  const kpiData = useMemo(() => {
    const currentYearData = data.filter(item => item.Jahr === selectedYear);
    const previousYearData = data.filter(item => item.Jahr === selectedYear - 1);

    const current = {
      totalZaehlerstand: currentYearData.reduce((sum, item) => sum + (Number(item["Wasser-Zählerstand"]) || 0), 0),
      totalVerbrauch: currentYearData.reduce((sum, item) => sum + (Number(item.Wasserverbrauch) || 0), 0),
      monthlyAverage: currentYearData.reduce((sum, item) => sum + (Number(item.Wasserverbrauch) || 0), 0) / Math.max(currentYearData.length, 1),
      dataPoints: currentYearData.length,
      maxVerbrauch: currentYearData.length > 0 ? Math.max(...currentYearData.map(item => Number(item.Wasserverbrauch) || 0)) : 0
    };

    const previous = {
      totalZaehlerstand: previousYearData.reduce((sum, item) => sum + (Number(item["Wasser-Zählerstand"]) || 0), 0),
      totalVerbrauch: previousYearData.reduce((sum, item) => sum + (Number(item.Wasserverbrauch) || 0), 0),
      monthlyAverage: previousYearData.reduce((sum, item) => sum + (Number(item.Wasserverbrauch) || 0), 0) / Math.max(previousYearData.length, 1),
      dataPoints: previousYearData.length,
      maxVerbrauch: previousYearData.length > 0 ? Math.max(...previousYearData.map(item => Number(item.Wasserverbrauch) || 0)) : 0
    };

    // Calcul des variations
    const calculateVariation = (currentValue, previousValue) => {
      const hasPreviousYearData = previousYearData.length > 0;
      
      if (!hasPreviousYearData || previousValue === 0 || !previousValue) {
        return { 
          value: 0, 
          percentage: 0, 
          hasData: false
        };
      }
      
      const value = currentValue - previousValue;
      const percentage = ((value / previousValue) * 100);
      
      return { 
        value, 
        percentage, 
        hasData: true,
        previousValue: previousValue
      };
    };

    const verbrauchVariation = calculateVariation(current.totalVerbrauch, previous.totalVerbrauch);
    const zaehlerstandVariation = calculateVariation(current.totalZaehlerstand, previous.totalZaehlerstand);
    const averageVariation = calculateVariation(current.monthlyAverage, previous.monthlyAverage);
    const maxVariation = calculateVariation(current.maxVerbrauch, previous.maxVerbrauch);

    return [
      {
        title: "Gesamtverbrauch",
        value: current.totalVerbrauch,
        suffix: "m³",
        prefix: <BarChartOutlined />,
        color: "#1890ff",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: verbrauchVariation,
        format: (val) => val.toLocaleString('de-DE'),
        tooltip: `Gesamtwasserverbrauch für ${selectedYear}`
      },
      {
        title: "Monatlicher Schnitt",
        value: current.monthlyAverage,
        suffix: "m³",
        prefix: <DashboardOutlined />,
        color: "#52c41a",
        description: `Durchschnitt pro Monat`,
        variation: averageVariation,
        format: (val) => val.toFixed(0),
        tooltip: `Durchschnittlicher monatlicher Verbrauch`
      },
      {
        title: "Zählerstand Gesamt",
        value: current.totalZaehlerstand,
        suffix: "m³",
        prefix: <BarChartOutlined />,
        color: "#faad14",
        description: `Vergleich zu ${selectedYear - 1}`,
        variation: zaehlerstandVariation,
        format: (val) => val.toLocaleString('de-DE'),
        tooltip: `Kumulierter Zählerstand`
      },
      {
        title: "Datensätze",
        value: current.dataPoints,
        suffix: `/12`,
        prefix: <CalendarOutlined />,
        color: "#722ed1",
        description: `Erfasste Monate in ${selectedYear}`,
        format: (val) => val,
        tooltip: `Vervollständigung der Datenerfassung`
      },
      {
        title: "Spitzenverbrauch",
        value: current.maxVerbrauch,
        suffix: "m³",
        prefix: <LineChartOutlined />,
        color: "#eb2f96",
        description: "Höchster Monatsverbrauch",
        variation: maxVariation,
        format: (val) => val.toLocaleString('de-DE'),
        tooltip: `Maximaler Verbrauch in einem Monat`
      },
      {
        title: "Effizienz KPI",
        value: current.dataPoints > 0 ? current.totalVerbrauch / current.dataPoints : 0,
        suffix: "m³/Monat",
        prefix: <DashboardOutlined />,
        color: "#13c2c2",
        description: "Verbrauch pro Datensatz",
        format: (val) => val.toFixed(0),
        tooltip: `Durchschnittlicher Verbrauch pro erfasstem Monat`
      }
    ];
  }, [data, selectedYear]);

  // --- Fonction pour rendre la variation ---
  const renderVariation = (variation) => {
    if (!variation.hasData) {
      return <Text type="secondary" style={{ fontSize: '11px' }}>Keine Vergleichsdaten</Text>;
    }

    const isPositive = variation.percentage > 0;
    const arrow = isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
    const color = isPositive ? '#cf1322' : '#3f8600';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
        {arrow}
        <Text style={{ color, fontSize: '11px', marginLeft: 4 }}>
          {Math.abs(variation.percentage).toFixed(1)}% 
        </Text>
      </div>
    );
  };

  const columns = [
    { 
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#3b7695' }} />
          <span>Jahr</span>
        </div>
      ), 
      dataIndex: "Jahr", 
      key: "Jahr",
      align: 'center',
      width: 100
    },
    { 
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ScheduleOutlined style={{ color: '#3b7695' }} />
          <span>Monat</span>
        </div>
      ), 
      dataIndex: "Monat", 
      key: "Monat",
      align: 'center',
      width: 80
    },
    { 
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#3b7695' }} />
          <span>Monatname</span>
        </div>
      ), 
      dataIndex: "Monatname", 
      key: "Monatname",
      align: 'center',
      width: 120
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <DashboardOutlined style={{ color: '#3b7695' }} />
          <span>Wasser-Zählerstand (m³)</span>
        </div>
      ),
      dataIndex: "Wasser-Zählerstand",
      key: "Wasser-Zählerstand",
      align: 'center',
      width: 160,
      render: (text, record) => record.key === "sum" ? 
        <Text strong style={{ color: '#3b7695' }}>{(text || 0).toLocaleString('de-DE')}</Text> : 
        (text ? Number(text).toLocaleString('de-DE') : '-')
    },
    { 
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <BarChartOutlined style={{ color: '#3b7695' }} />
          <span>Wasserverbrauch (m³)</span>
        </div>
      ), 
      dataIndex: "Wasserverbrauch", 
      key: "Wasserverbrauch",
      align: 'center',
      width: 160,
      render: (text, record) => record.key === "sum" ? 
        <Text strong style={{ color: '#3b7695' }}>{(text || 0).toLocaleString('de-DE')}</Text> : 
        (text ? Number(text).toLocaleString('de-DE') : '-')
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <ToolOutlined style={{ color: '#3b7695' }} />
          <span>Aktion</span>
        </div>
      ),
      key: "aktion",
      align: 'center',
      width: 130,
      fixed: 'right',
      render: (_, record) =>
        record.key === "sum" ? null : (
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ 
              backgroundColor: '#3b7695', 
              borderColor: '#3b7695',
              fontWeight: 500
            }}
          >
            Bearbeiten
          </Button>
        ),
    },
  ];

  const sumRowStyle = {
    backgroundColor: "#e6f7ff",
    fontWeight: "bold",
    borderTop: "2px solid #3b7695",
  };

  // Gestion du changement d'année
  const handleYearChange = (value) => {
    setSelectedYear(value);
    filterData(data, value, selectedMonth);
  };

  // Fonction pour le bouton "Daten aktualisieren"
  const handleRefreshData = () => {
    fetchData();
  };

  return (
    <Layout style={{ minHeight:"100vh" }}>
      {contextHolder}
      <Header style={{ 
        background:"white", 
        display:"flex", 
        justifyContent:"space-between", 
        alignItems:"center", 
        padding:"0 24px", 
        boxShadow:"0 2px 8px rgba(0,0,0,0.15)" 
      }}>
        <Title level={2} style={{ color:"#3b7695", margin:0, fontWeight:600 }}>
          <DashboardOutlined style={{ marginRight: 12 }} />
          Wasser Übersicht
        </Title>
        <Space>
          {/* Filtres dans le header */}
          <Select 
            value={selectedYear} 
            style={{ width:120, height:"40px" }} 
            onChange={handleYearChange}
            suffixIcon={<CalendarOutlined style={{ color:"#3b7695" }} />}
            placeholder="Jahr"
          >
            {years.map(y => <Option key={y} value={y}>{y}</Option>)}
          </Select>

          <Select 
            value={selectedMonth} 
            style={{ width:140, height:"40px" }} 
            onChange={(value) => setSelectedMonth(value)}
            suffixIcon={<ScheduleOutlined style={{ color:"#3b7695" }} />}
            placeholder="Monat"
            allowClear
          >
            {months.map((m) => (
              <Option key={m.value} value={m.value}>{m.label}</Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={handleFilter}
            style={{ 
              height: "40px",
              backgroundColor: "#3b7695",
              borderColor: "#3b7695",
              fontWeight: 500
            }}
          >
            Filtern
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={resetFilter}
            style={{ 
              height: "40px",
              borderColor: "#3b7695",
              color: "#3b7695"
            }}
          >
            Reset
          </Button>

          <Button 
            type="primary" 
            icon={<SyncOutlined />} 
            loading={loadingAktualisieren} 
            onClick={handleRefreshData}
            style={{ 
              backgroundColor:"#3b7695", 
              borderColor:"#3b7695", 
              fontWeight:500, 
              height:"40px" 
            }}
          >
            Aktualisieren
          </Button>
        </Space>
      </Header>

      <Content style={{ padding:"24px" }}>
        
        {/* --- DASHBOARD KPI SECTION COMPACTE --- */}
        <Card 
          style={{ 
            marginBottom: 24, 
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
            border: "1px solid #d6e4ff",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: "100%"
          }}
          bodyStyle={{ padding: "16px 20px" }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={3} style={{ color: "#3b7695", margin: 0, fontSize: '20px' }}>
              <RocketOutlined style={{ marginRight: 12, color: "#1890ff" }} />
              Wasser Performance {selectedYear}
            </Title>
            <Text strong style={{ color: "#666", fontSize: '14px' }}>
              <FilterOutlined style={{ marginRight: 8 }} />
              Vergleich mit {selectedYear - 1}
            </Text>
          </div>

          {/* KPI CARDS - COMPACTES SUR UNE SEULE LIGNE */}
          <Row gutter={[12, 12]} style={{ width: "100%" }}>
            {kpiData.map((kpi, index) => (
              <Col xs={24} sm={12} md={8} lg={4} key={index} style={{ display: 'flex' }}>
                <Card 
                  size="small" 
                  style={{ 
                    textAlign: 'center',
                    borderLeft: `3px solid ${kpi.color}`,
                    borderRadius: '6px',
                    background: 'white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    width: '100%',
                    height: '110px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                  bodyStyle={{ 
                    padding: '12px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <div style={{ marginBottom: '6px' }}>
                    <Text style={{ color: kpi.color, fontWeight: 600, fontSize: '11px' }}>
                      {React.cloneElement(kpi.prefix, { style: { marginRight: 6, fontSize: '12px' } })}
                      {kpi.title}
                    </Text>
                  </div>
                  
                  <Statistic
                    value={kpi.value}
                    suffix={kpi.suffix}
                    precision={kpi.precision || 0}
                    valueStyle={{ 
                      color: kpi.color, 
                      fontSize: '16px',
                      fontWeight: 700,
                      lineHeight: '1.2'
                    }}
                    formatter={value => kpi.format ? kpi.format(value) : value}
                  />
                  
                  <Text type="secondary" style={{ fontSize: '9px', marginTop: '4px', display: 'block' }}>
                    {kpi.description}
                  </Text>
                  
                  <div style={{ marginTop: '6px' }}>
                    {kpi.variation && renderVariation(kpi.variation)}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Section Tableau avec bouton d'ajout */}
        <Card style={{ marginBottom: 24 }}>
          <Space style={{ marginBottom:16 }}>
            <Button 
              type="primary" 
              icon={<PlusCircleOutlined />} 
              onClick={() => setAddingRecord(true)} 
              style={{ 
                backgroundColor: "#3b7695", 
                borderColor: "#3b7695", 
                height: "40px", 
                fontWeight: 600 
              }}
            >
              Neue Monatswerte erfassen
            </Button>
          </Space>

          <Spin spinning={loadingAktualisieren} tip={<span style={{ color:"#3b7695", fontWeight:600 }}>Laden...</span>} size="large">
            <div style={{ border: `2px solid #3b7695`, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
              <Table
                rowKey={(record) => record.WasserMonatID || record.key}
                dataSource={filteredData}
                columns={columns}
                pagination={false}
                bordered
                scroll={{ x: 800 }}
                rowClassName={(record) => (record.key === "sum" ? "sum-row" : "")}
                components={{
                  body: {
                    row: ({ children, ...props }) => {
                      if (props["data-row-key"] === "sum") {
                        return <tr {...props} style={sumRowStyle}>{children}</tr>;
                      }
                      return <tr {...props}>{children}</tr>;
                    }
                  }
                }}
              />
            </div>
          </Spin>
        </Card>
      </Content>

      {/* Modal édition */}
      <Modal
        title={<span style={{ color: "#3b7695", fontWeight: 600, fontSize: "18px" }}><EditOutlined style={{ marginRight: 8 }} />Daten bearbeiten</span>}
        open={!!editingRecord}
        onCancel={() => setEditingRecord(null)}
        onOk={handleSave}
        confirmLoading={saving}
        okText="Speichern"
        cancelText="Abbrechen"
        okButtonProps={{ style:{ backgroundColor:'#3b7695', borderColor:'#3b7695', height: '40px' } }}
        cancelButtonProps={{ style: { height: '40px' } }}
        width={600}
      >
        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f0f8ff', border: '1px solid #d6e4ff' }}>
          <Text style={{ color: '#3b7695', fontSize: '14px' }}>
            <CalendarOutlined style={{ marginRight: 8 }} />
            {`Aktualisieren Sie die Wasser-Daten für ${editingRecord?.Monatname} ${editingRecord?.Jahr} - Alle Änderungen werden direkt im System gespeichert.`}
          </Text>
        </Card>

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Item
                label={
                  <span style={{ fontWeight: '500' }}>
                    <DashboardOutlined style={{ marginRight: 8, color: '#3b7695' }} />
                    Wasser-Zählerstand (m³)
                  </span>
                }
                name="Wasser-Zählerstand" 
                rules={[{ 
                  required: true, 
                  message: 'Bitte geben Sie den aktuellen Zählerstand ein' 
                }]}
              >
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  style={{ height: '40px' }}
                  addonAfter="m³"
                />
              </Item>
            </Col>
            <Col span={12}>
              <Item
                label={
                  <span style={{ fontWeight: '500' }}>
                    <BarChartOutlined style={{ marginRight: 8, color: '#3b7695' }} />
                    Wasserverbrauch (m³)
                  </span>
                }
                name="Wasserverbrauch" 
                rules={[{ 
                  required: true, 
                  message: 'Bitte geben Sie den Verbrauchswert ein' 
                }]}
              >
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  style={{ height: '40px' }}
                  addonAfter="m³"
                />
              </Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Ajout */}
      <Modal
        title={<span style={{ color: "#3b7695", fontWeight: 600, fontSize: "18px" }}><PlusCircleOutlined style={{ marginRight: 8 }} />Neue Monatswerte erfassen</span>}
        open={addingRecord}
        onCancel={() => setAddingRecord(false)}
        onOk={handleAdd}
        confirmLoading={saving}
        okText="Daten speichern"
        cancelText="Abbrechen"
        width={600}
        okButtonProps={{ style:{ backgroundColor:'#3b7695', borderColor:'#3b7695', height: '40px' } }}
        cancelButtonProps={{ style: { height: '40px' } }}
      >
        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Text style={{ color: '#52c41a', fontSize: '14px' }}>
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginRight: 8 }} />
            Erfassen Sie neue Monatswerte für die Wasser-Dokumentation - Alle Daten werden systematisch erfasst und für die Auswertung verfügbar gemacht.
          </Text>
        </Card>

        <Form form={addForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Item
                label={
                  <span style={{ fontWeight: '500' }}>
                    <CalendarOutlined style={{ marginRight: 8, color: '#3b7695' }} />
                    Jahr
                  </span>
                }
                name="Jahr" 
                rules={[{ 
                  required: true, 
                  message: 'Bitte geben Sie das Berichtsjahr ein' 
                }]}
              >
                <Input 
                  type="number" 
                  placeholder="z.B. 2025" 
                  style={{ height: '40px' }}
                />
              </Item>
            </Col>
            <Col span={12}>
              <Item
                label={
                  <span style={{ fontWeight: '500' }}>
                    <ScheduleOutlined style={{ marginRight: 8, color: '#3b7695' }} />
                    Monat
                  </span>
                }
                name="Monat" 
                rules={[{ 
                  required: true, 
                  message: 'Bitte wählen Sie den Berichtsmonat aus' 
                }]}
              >
                <Select 
                  placeholder="Monat auswählen"
                  style={{ height: '40px' }}
                >
                  {monthNames.map((m, i) => (
                    <Option key={i+1} value={i+1}>
                      {m}
                    </Option>
                  ))}
                </Select>
              </Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Item
                label={
                  <span style={{ fontWeight: '500' }}>
                    <DashboardOutlined style={{ marginRight: 8, color: '#3b7695' }} />
                    Wasser-Zählerstand (m³)
                  </span>
                }
                name="Wasser-Zählerstand" 
                rules={[{ 
                  required: true, 
                  message: 'Bitte geben Sie den aktuellen Zählerstand ein' 
                }]}
              >
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  style={{ height: '40px' }}
                  addonAfter="m³"
                />
              </Item>
            </Col>
            <Col span={12}>
              <Item
                label={
                  <span style={{ fontWeight: '500' }}>
                    <BarChartOutlined style={{ marginRight: 8, color: '#3b7695' }} />
                    Wasserverbrauch (m³)
                  </span>
                }
                name="Wasserverbrauch" 
                rules={[{ 
                  required: true, 
                  message: 'Bitte geben Sie den Verbrauchswert ein' 
                }]}
              >
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  style={{ height: '40px' }}
                  addonAfter="m³"
                />
              </Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AppWasserMonat;