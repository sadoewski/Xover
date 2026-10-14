import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../../data/taskbases.json');

class TaskBaseModel {
  constructor() {
    this.ensureDataFile();
  }

  ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ taskbases: [] }, null, 2));
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
    return data.taskbases || [];
  }

  getById(id) {
    const taskbases = this.getAll();
    return taskbases.find(dt => dt.id === id);
  }

  create(taskbaseData) {
    const data = this.readData();
    const newTaskBase = {
      id: Date.now().toString(),
      name: taskbaseData.name,
      group: taskbaseData.group,
      time_bound: taskbaseData.time_bound || null,
      dates: taskbaseData.dates || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    data.taskbases.push(newTaskBase);
    this.writeData(data);
    return newTaskBase;
  }

  update(id, updates) {
    const data = this.readData();
    const index = data.taskbases.findIndex(dt => dt.id === id);
    
    if (index === -1) return null;
    
    data.taskbases[index] = {
      ...data.taskbases[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.writeData(data);
    return data.taskbases[index];
  }

  delete(id) {
    const data = this.readData();
    const index = data.taskbases.findIndex(dt => dt.id === id);
    
    if (index === -1) return false;
    
    data.taskbases.splice(index, 1);
    this.writeData(data);
    return true;
  }

  addDate(id, dateObj) {
    const taskbase = this.getById(id);
    if (!taskbase) return null;
    
    const newDate = {
      year: dateObj.year,
      month: dateObj.month,
      day: dateObj.day,
      status: 'pending'
    };
    
    taskbase.dates.push(newDate);
    return this.update(id, { dates: taskbase.dates });
  }

  removeDate(id, year, month, day) {
    const taskbase = this.getById(id);
    if (!taskbase) return null;
    
    taskbase.dates = taskbase.dates.filter(d => 
      !(d.year === year && d.month === month && d.day === day)
    );
    
    return this.update(id, { dates: taskbase.dates });
  }

  updateDateStatus(id, year, month, day, status) {
    const taskbase = this.getById(id);
    if (!taskbase) return null;
    
    const date = taskbase.dates.find(d => 
      d.year === year && d.month === month && d.day === day
    );
    
    if (date) {
      date.status = status;
      return this.update(id, { dates: taskbase.dates });
    }
    
    return null;
  }
}

const TaskBase = new TaskBaseModel();
export default TaskBase;
