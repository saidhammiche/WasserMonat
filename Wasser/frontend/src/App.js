import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Spin, Alert, Select, Row, Col, Card, Typography } from "antd";
import {
  EditOutlined,
  SyncOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  FilterOutlined,
  ReloadOutlined,
  PlusOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;
const { Title } = Typography;

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
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingAktualisieren, setLoadingAktualisieren] = useState(false);

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
      setSuccessMessage("✅ Änderungen wurden erfolgreich gespeichert!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
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
      setSuccessMessage("✅ Neue Daten wurden erfolgreich hinzugefügt!");
      setTimeout(() => setSuccessMessage(null), 4000);
      addForm.resetFields();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: "Jahr", dataIndex: "Jahr", key: "Jahr" },
    { title: "Monat", dataIndex: "Monat", key: "Monat" },
    { title: "Monatname", dataIndex: "Monatname", key: "Monatname" },
    {
      title: "Wasser-Zählerstand (m3)",
      dataIndex: "Wasser-Zählerstand",
      key: "Wasser-Zählerstand",
    },
    { title: "Wasserverbrauch (m3)", dataIndex: "Wasserverbrauch", key: "Wasserverbrauch" },
    {
      title: "Aktion",
      key: "aktion",
      render: (_, record) =>
        record.key === "sum" ? null : (
          <Button type="primary" shape="circle" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        ),
    },
  ];

  const sumRowStyle = {
    backgroundColor: "#e6f7ff",
    fontWeight: "bold",
    borderTop: "2px solid #3b7695",
    transition: "background-color 1s",
    animation: "pulse 2s infinite",
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Titre */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: 30,
        background: "linear-gradient(135deg, #3b7695 0%, #2c5c77 100%)",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        color: "white"
      }}>
        <Title level={2} style={{ color: "white", margin: 0, fontWeight: 600 }}>
          📊 Wasser Monatsdaten Analyse
        </Title>
        <p style={{ margin: "10px 0 0 0", opacity: 0.9, fontSize: "16px" }}>
          Überwachung und Verwaltung der monatlichen Wasserverbrauchsdaten
        </p>
      </div>

      {/* Section Filtres */}
      <Card
        title="Filter & Aktualisieren"
        style={{ marginBottom: 20, borderColor: "#3b7695", borderWidth: 2, borderStyle: "solid" }}
        headStyle={{ backgroundColor: "#3b7695", color: "#fff", fontWeight: "bold" }}
        bodyStyle={{ padding: 15 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddingRecord(true)}>
            Neue Werte hinzufügen
          </Button>
        }
      >
        <Row gutter={[15, 15]} justify="start" align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={<span><CalendarOutlined /> Jahr auswählen</span>}
              style={{ width: "100%" }}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
            >
              {years.map((y) => (
                <Option key={y} value={y}>{y}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder={<span><ScheduleOutlined /> Monat auswählen</span>}
              style={{ width: "100%" }}
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              allowClear
            >
              {months.map((m) => (
                <Option key={m.value} value={m.value}>{m.label}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleFilter}
              style={{ width: "100%" }}
            >
              Filtern
            </Button>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilter}
              style={{ width: "100%" }}
            >
              Reset Filter
            </Button>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Button
              type="default"
              icon={<SyncOutlined spin={loadingAktualisieren} />}
              onClick={fetchData}
              style={{ width: "100%" }}
            >
              Aktualisieren
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Section Tableau */}
      <Card style={{ borderColor: "#3b7695", borderWidth: 2, borderStyle: "solid" }} bodyStyle={{ padding: 15 }} bordered>
        {successMessage && (
          <Alert message={successMessage} type="success" showIcon style={{ marginBottom: 20 }} />
        )}

        <Table
          rowKey={(record) => record.WasserMonatID || record.key}
          dataSource={filteredData}
          columns={columns}
          pagination={false}
          bordered
          scroll={{ x: "max-content" }}
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
      </Card>

      {/* Modal édition - Version Professionnelle Améliorée */}
      <Modal
        open={!!editingRecord}
        title={
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <EditOutlined style={{ color: '#3b7695', fontSize: '24px', marginRight: '10px' }} />
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#3b7695' }}>
              Wasserverbrauchsdaten bearbeiten
            </span>
          </div>
        }
        onCancel={() => setEditingRecord(null)}
        onOk={handleSave}
        okText={
          <span>
            <EditOutlined />
            Änderungen speichern
          </span>
        }
        cancelText="Abbrechen"
        okButtonProps={{ 
          disabled: saving,
          style: { background: '#3b7695', borderColor: '#3b7695' }
        }}
        width={600}
        style={{ top: 20 }}
      >
        <Spin spinning={saving} tip="Änderungen werden gespeichert..." size="large">
          
          {/* Section d'informations du record */}
          {editingRecord && (
            <div style={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              border: '1px solid #ffb74d',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              borderLeft: '4px solid #ff9800'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  background: '#ff9800',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>i</span>
                </div>
                <div>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontWeight: '600',
                    color: '#e65100',
                    fontSize: '14px'
                  }}>
                    Datensatz bearbeiten
                  </p>
                  <p style={{ 
                    margin: 0,
                    color: '#bf360c',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    Sie bearbeiten die Daten für <strong>{monthNames[editingRecord.Monat - 1]}</strong> {editingRecord.Jahr}. 
                    Bitte nehmen Sie die erforderlichen Anpassungen vor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section Zeitraum (informative - non éditable) */}
          <div style={{
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #d9d9d9'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #3b7695'
            }}>
              <CalendarOutlined style={{ color: '#3b7695', marginRight: '8px' }} />
              <span style={{ fontWeight: '600', color: '#3b7695', fontSize: '15px' }}>
                Zeitraum (nicht änderbar)
              </span>
            </div>
            
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#595959'
                  }}>
                    Jahr
                  </label>
                  <Input 
                    value={editingRecord?.Jahr} 
                    disabled 
                    style={{ 
                      height: '40px',
                      background: '#fafafa',
                      color: '#8c8c8c'
                    }}
                    prefix={<CalendarOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '500',
                    marginBottom: '8px',
                    color: '#595959'
                  }}>
                    Monat
                  </label>
                  <Input 
                    value={editingRecord ? monthNames[editingRecord.Monat - 1] : ''} 
                    disabled 
                    style={{ 
                      height: '40px',
                      background: '#fafafa',
                      color: '#8c8c8c'
                    }}
                    prefix={<ScheduleOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </div>
              </Col>
            </Row>
          </div>

          <Form form={form} layout="vertical" requiredMark="optional">
            
            {/* Section Verbrauchsdaten éditables */}
            <div style={{
              background: '#fafafa',
              padding: '16px',
              borderRadius: '6px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #3b7695'
              }}>
                <ScheduleOutlined style={{ color: '#3b7695', marginRight: '8px' }} />
                <span style={{ fontWeight: '600', color: '#3b7695', fontSize: '15px' }}>
                  Verbrauchsdaten anpassen
                </span>
              </div>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <span style={{ fontWeight: '500' }}>
                        Wasser-Zählerstand (m³) <span style={{ color: '#ff4d4f' }}>*</span>
                      </span>
                    }
                    name="Wasser-Zählerstand" 
                    rules={[{ 
                      required: true, 
                      message: 'Bitte geben Sie den aktuellen Zählerstand ein' 
                    }]}
                    tooltip="Aktueller Stand des Wasserzählers in Kubikmetern"
                  >
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      style={{ height: '40px' }}
                      prefix={<span style={{ color: '#999' }}>m³</span>}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <span style={{ fontWeight: '500' }}>
                        Wasserverbrauch (m³) <span style={{ color: '#ff4d4f' }}>*</span>
                      </span>
                    }
                    name="Wasserverbrauch" 
                    rules={[{ 
                      required: true, 
                      message: 'Bitte geben Sie den Verbrauchswert ein' 
                    }]}
                    tooltip="Verbrauchte Wassermenge in Kubikmetern für diesen Monat"
                  >
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      style={{ height: '40px' }}
                      prefix={<span style={{ color: '#999' }}>m³</span>}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              {/* Note informative */}
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '4px',
                padding: '8px 12px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#52c41a', fontSize: '12px' }}>💡</span>
                  <span style={{ fontSize: '12px', color: '#389e0d' }}>
                    Aktualisieren Sie die Werte sorgfältig. Die Änderungen wirken sich direkt auf die Verbrauchsanalyse aus.
                  </span>
                </div>
              </div>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Modal Ajout - Version Professionnelle Améliorée */}
      <Modal
        open={addingRecord}
        title={
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <PlusOutlined style={{ color: '#3b7695', fontSize: '24px', marginRight: '10px' }} />
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#3b7695' }}>
              Neue Wasserverbrauchsdaten erfassen
            </span>
          </div>
        }
        onCancel={() => setAddingRecord(false)}
        onOk={handleAdd}
        okText={
          <span>
            <PlusOutlined />
            Daten hinzufügen
          </span>
        }
        cancelText="Abbrechen"
        okButtonProps={{ 
          disabled: saving,
          style: { background: '#3b7695', borderColor: '#3b7695' }
        }}
        width={600}
        style={{ top: 20 }}
      >
        <Spin spinning={saving} tip="Daten werden gespeichert..." size="large">
          
          {/* Section d'instructions professionnelle */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
            border: '1px solid #d6e4ff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            borderLeft: '4px solid #3b7695'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                background: '#3b7695',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>i</span>
              </div>
              <div>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontWeight: '600',
                  color: '#2c3e50',
                  fontSize: '14px'
                }}>
                  Anleitung zur Dateneingabe
                </p>
                <p style={{ 
                  margin: 0,
                  color: '#5c6b7a',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}>
                  Bitte erfassen Sie hier die monatlichen Wasserverbrauchsdaten. 
                  Tragen Sie die Werte sorgfältig ein, um eine korrekte Verbrauchsanalyse zu gewährleisten.
                </p>
              </div>
            </div>
          </div>

          <Form form={addForm} layout="vertical" requiredMark="optional">
            
            {/* Section Zeitraum */}
            <div style={{
              background: '#fafafa',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #3b7695'
              }}>
                <CalendarOutlined style={{ color: '#3b7695', marginRight: '8px' }} />
                <span style={{ fontWeight: '600', color: '#3b7695', fontSize: '15px' }}>
                  Zeitraum festlegen
                </span>
              </div>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <span style={{ fontWeight: '500' }}>
                        Jahr <span style={{ color: '#ff4d4f' }}>*</span>
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
                      prefix={<CalendarOutlined style={{ color: '#999' }} />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <span style={{ fontWeight: '500' }}>
                        Monat <span style={{ color: '#ff4d4f' }}>*</span>
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
                      suffixIcon={<ScheduleOutlined style={{ color: '#999' }} />}
                    >
                      {monthNames.map((m, i) => (
                        <Option key={i+1} value={i+1}>
                          {m}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Section Verbrauchsdaten */}
            <div style={{
              background: '#fafafa',
              padding: '16px',
              borderRadius: '6px',
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #3b7695'
              }}>
                <ScheduleOutlined style={{ color: '#3b7695', marginRight: '8px' }} />
                <span style={{ fontWeight: '600', color: '#3b7695', fontSize: '15px' }}>
                  Verbrauchsdaten erfassen
                </span>
              </div>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <span style={{ fontWeight: '500' }}>
                        Wasser-Zählerstand (m³) <span style={{ color: '#ff4d4f' }}>*</span>
                      </span>
                    }
                    name="Wasser-Zählerstand" 
                    rules={[{ 
                      required: true, 
                      message: 'Bitte geben Sie den aktuellen Zählerstand ein' 
                    }]}
                    tooltip="Aktueller Stand des Wasserzählers in Kubikmetern"
                  >
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      style={{ height: '40px' }}
                      prefix={<span style={{ color: '#999' }}>m³</span>}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <span style={{ fontWeight: '500' }}>
                        Wasserverbrauch (m³) <span style={{ color: '#ff4d4f' }}>*</span>
                      </span>
                    }
                    name="Wasserverbrauch" 
                    rules={[{ 
                      required: true, 
                      message: 'Bitte geben Sie den Verbrauchswert ein' 
                    }]}
                    tooltip="Verbrauchte Wassermenge in Kubikmetern für diesen Monat"
                  >
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      style={{ height: '40px' }}
                      prefix={<span style={{ color: '#999' }}>m³</span>}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              {/* Note informative */}
              <div style={{
                background: '#fffbe6',
                border: '1px solid #ffe58f',
                borderRadius: '4px',
                padding: '8px 12px',
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#faad14', fontSize: '12px' }}>💡</span>
                  <span style={{ fontSize: '12px', color: '#8c6e1c' }}>
                    Die Werte werden in Kubikmetern (m³) erfasst. Bitte achten Sie auf die korrekte Dezimaltrennung.
                  </span>
                </div>
              </div>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default AppWasserMonat;