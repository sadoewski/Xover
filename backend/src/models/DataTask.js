import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../../data/datatasks.json');

class DataTaskModel {
  constructor() {
    this.ensureDataFile();
  }

  ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ datatasks: [] }, null, 2));
    }
  }

  readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  }

  writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  getAll() {
    const data = this.readData();
    return data.datatasks || [];
  }

  getById(id) {
    const datatasks = this.getAll();
    return datatasks.find(dt => dt.id === id);
  }

  create(datataskData) {
    const data = this.readData();
    const newDataTask = {
      id: Date.now().toString(),
      name: datataskData.name,
      group: datataskData.group,
      time_bound: datataskData.time_bound || null,
      dates: datataskData.dates || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    data.datatasks.push(newDataTask);
    this.writeData(data);
    return newDataTask;
  }

  update(id, updates) {
    const data = this.readData();
    const index = data.datatasks.findIndex(dt => dt.id === id);
    
    if (index === -1) return null;
    
    data.datatasks[index] = {
      ...data.datatasks[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.writeData(data);
    return data.datatasks[index];
  }

  delete(id) {
    const data = this.readData();
    const index = data.datatasks.findIndex(dt => dt.id === id);
    
    if (index === -1) return false;
    
    data.datatasks.splice(index, 1);
    this.writeData(data);
    return true;
  }

  addDate(id, dateObj) {
    const datatask = this.getById(id);
    if (!datatask) return null;
    
    const newDate = {
      year: dateObj.year,
      month: dateObj.month,
      day: dateObj.day,
      status: 'pending'
    };
    
    datatask.dates.push(newDate);
    return this.update(id, { dates: datatask.dates });
  }

  removeDate(id, year, month, day) {
    const datatask = this.getById(id);
    if (!datatask) return null;
    
    datatask.dates = datatask.dates.filter(d => 
      !(d.year === year && d.month === month && d.day === day)
    );
    
    return this.update(id, { dates: datatask.dates });
  }

  updateDateStatus(id, year, month, day, status) {
    const datatask = this.getById(id);
    if (!datatask) return null;
    
    const date = datatask.dates.find(d => 
      d.year === year && d.month === month && d.day === day
    );
    
    if (date) {
      date.status = status;
      return this.update(id, { dates: datatask.dates });
    }
    
    return null;
  }
}

const DataTask = new DataTaskModel();
export default DataTask;
