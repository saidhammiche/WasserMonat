import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Modal, Form, Input, Spin, Alert, Select, Row, Col, Card } from "antd";
import {
  EditOutlined,
  SyncOutlined,
  CalendarOutlined,
  ScheduleOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Option } = Select;

const AppWasserMonat = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingAktualisieren, setLoadingAktualisieren] = useState(false);

  // Utilisation de useCallback pour mémoriser la fonction fetchData
  const fetchData = useCallback(async () => {
    try {
      setLoadingAktualisieren(true);
      const res = await axios.get("http://localhost:5000/api/wassermonat");
      const allData = res.data;
      setData(allData);

      const uniqueYears = [...new Set(allData.map((d) => d.Jahr))].sort();
      const uniqueMonths = [...new Set(allData.map((d) => d.Monat))].sort();
      setYears(uniqueYears);
      setMonths(uniqueMonths);

      const latestYear = Math.max(...uniqueYears);
      setSelectedYear(latestYear);
      filterData(allData, latestYear, null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAktualisieren(false);
    }
  }, []); // Aucune dépendance car cette fonction ne dépend que de setState

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Maintenant fetchData est une dépendance stable

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

      const start = Date.now();

      await axios.put(
        `http://localhost:5000/api/wassermonat/${editingRecord.WasserMonatID}`,
        values
      );

      const elapsed = Date.now() - start;
      const remaining = 2000 - elapsed;

      setTimeout(() => {
        setEditingRecord(null);
        setSaving(false);
        fetchData();

        setSuccessMessage("✅ Änderungen wurden erfolgreich gespeichert!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }, remaining > 0 ? remaining : 0);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: "Jahr", dataIndex: "Jahr", key: "Jahr" },
    { title: "Monat", dataIndex: "Monat", key: "Monat" },
    { title: "Monatname", dataIndex: "Monatname", key: "Monatname" },
    {
      title: "Wasser-Zählerstand",
      dataIndex: "Wasser-Zählerstand",
      key: "Wasser-Zählerstand",
    },
    { title: "Wasserverbrauch", dataIndex: "Wasserverbrauch", key: "Wasserverbrauch" },
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
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Wasser Monatsdaten</h2>

      {/* Section Filtres */}
      <Card
        title="Filter & Aktualisieren"
        style={{ marginBottom: 20, borderColor: "#3b7695", borderWidth: 2, borderStyle: "solid" }}
        headStyle={{ backgroundColor: "#3b7695", color: "#fff", fontWeight: "bold" }}
        bodyStyle={{ padding: 15 }}
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
                <Option key={m} value={m}>{m}</Option>
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
          // inline style pour la ligne Summe
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

      {/* Modal édition */}
      <Modal
        open={!!editingRecord}
        title="Daten bearbeiten"
        onCancel={() => setEditingRecord(null)}
        onOk={handleSave}
        okText="Speichern"
        cancelText="Abbrechen"
        okButtonProps={{ disabled: saving }}
      >
        <Spin spinning={saving} tip="Bitte warten..." size="large">
          <div style={{ marginBottom: 15, fontStyle: "italic", color: "#555" }}>
            Bitte ändern Sie die Werte und klicken Sie anschließend auf <b>Speichern</b>.
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              label={<span style={{ fontWeight: "bold" }}>Wasser-Zählerstand</span>}
              name="Wasser-Zählerstand"
            >
              <Input type="number" placeholder="Neuen Wert eingeben" />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: "bold" }}>Wasserverbrauch</span>}
              name="Wasserverbrauch"
            >
              <Input type="number" placeholder="Neuen Wert eingeben" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default AppWasserMonat;