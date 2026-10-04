# Standalone Mode

## What is Standalone Mode?

Standalone mode allows HostPrint to run completely offline without any cloud backend. All data is stored locally on your Mac, and the application functions entirely autonomously. No internet connection is required after initial setup.

In standalone mode, the macOS application runs its own local backend server that handles all printing operations, host management, and data storage on your device.

## When to Use Standalone Mode

Standalone mode is ideal if you:

- **Value privacy**: Keep all printing data on your local machine with no cloud transmission
- **Work offline**: Need the app to function without internet connectivity
- **Run locally only**: Don't need multi-device synchronization
- **Have compliance requirements**: Must keep data within specific physical boundaries
- **Prefer simplicity**: Want a self-contained application without external dependencies

## How to Enable Standalone Mode

### Initial Setup

1. Open **HostPrint** preferences (⌘,)
2. Navigate to the **Backend** tab
3. Select **Standalone Mode** from the backend options
4. Click **Apply**

The application will automatically:
- Initialize a local SQLite database
- Start a local backend server (runs only when the app is open)
- Configure all services to use local storage

### Switching from Hybrid to Standalone

If you're currently using cloud sync:

1. **Backup your data** (see Data Location section below)
2. Enable standalone mode in preferences
3. Choose whether to:
   - **Keep existing local data**: Preserves your current hosts and print history
   - **Start fresh**: Clears all data and begins with a clean state

## What Works in Standalone Mode

✅ **Full functionality**:
- Add, edit, and manage hosts
- Print to all configured hosts
- View complete print history
- Search and filter operations
- All printer discovery features
- Job queue management
- Error handling and retries
- Local preferences and settings

Everything you can do with cloud backend, you can do in standalone mode.

## What Does NOT Work in Standalone Mode

❌ **Cloud-dependent features**:
- **Multi-device sync**: Changes made on one device won't appear on others
- **Cloud backup**: No automatic backup to remote servers
- **Remote access**: Can't access your hosts from other machines
- **Shared host lists**: Can't share configurations with team members

If you need these features, consider using hybrid mode instead.

## Migrating to Hybrid Mode Later

You can switch from standalone to hybrid mode at any time:

### Migration Process

1. **Backup your standalone data**:
   ```bash
   cp ~/Library/Application\ Support/HostPrint/hostprint.db ~/Desktop/hostprint-backup.db
   ```

2. **Deploy or connect to cloud backend** (see DEPLOYMENT.md)

3. **Switch to hybrid mode** in preferences:
   - Open Preferences > Backend
   - Select "Hybrid Mode"
   - Enter your backend URL
   - Click Apply

4. **Import your data**:
   - The app will detect local data
   - Choose "Upload to Cloud" to sync your existing hosts and history
   - Or choose "Download from Cloud" to replace local data with cloud data

### Data Merge Strategy

When migrating:
- **Hosts**: Merged by hostname (cloud data wins on conflicts)
- **Print history**: Appended (all records preserved)
- **Settings**: Local settings preserved, cloud settings added

## Data Location and Backup

### Where Your Data Lives

In standalone mode, all data is stored at:

```
~/Library/Application Support/HostPrint/
├── hostprint.db          # Main database (hosts, history, jobs)
├── preferences.json      # Application preferences
└── logs/                 # Application logs
```

### Manual Backup

To backup your data:

```bash
# Create timestamped backup
cp ~/Library/Application\ Support/HostPrint/hostprint.db \
   ~/Desktop/hostprint-backup-$(date +%Y%m%d).db
```

### Restore from Backup

```bash
# Restore from backup (quit HostPrint first)
cp ~/Desktop/hostprint-backup-YYYYMMDD.db \
   ~/Library/Application\ Support/HostPrint/hostprint.db
```

### Scheduled Backups (Recommended)

Set up automatic daily backups using Time Machine or a cron job:

```bash
# Add to crontab (crontab -e)
0 2 * * * cp ~/Library/Application\ Support/HostPrint/hostprint.db \
          ~/Documents/HostPrint-Backups/hostprint-$(date +\%Y\%m\%d).db
```

## FAQ

### Can I switch between standalone and hybrid modes?

**Yes, freely.** You can switch at any time through preferences. Your data can be migrated in either direction.

### Will I lose data when switching modes?

**No, if you follow migration steps.** Always backup before switching. The app will guide you through data import/export when changing modes.

### Can I use standalone on one Mac and hybrid on another?

**Yes.** Each installation is independent. You can run different modes on different devices.

### Is standalone mode slower than hybrid?

**No.** Performance is identical. Both modes use the same backend code; standalone just runs it locally instead of on a remote server.

### How much disk space does standalone mode use?

**Minimal.** The SQLite database grows with your print history:
- Typical usage: 5-50 MB
- Heavy usage (10,000+ print jobs): 100-200 MB
- Database is automatically optimized (VACUUM) monthly

### What happens if the app crashes?

**Data is safe.** All database operations use transactions. If the app crashes, the database will be in the last consistent state. No data loss.

### Can I access the database directly?

**Yes, but not recommended.** The database is SQLite:

```bash
sqlite3 ~/Library/Application\ Support/HostPrint/hostprint.db
```

Direct modifications may break application assumptions. Always backup before manual edits.

### How do I troubleshoot standalone mode issues?

1. **Check logs**:
   ```bash
   tail -f ~/Library/Application\ Support/HostPrint/logs/app.log
   ```

2. **Verify database integrity**:
   ```bash
   sqlite3 ~/Library/Application\ Support/HostPrint/hostprint.db "PRAGMA integrity_check;"
   ```

3. **Reset if corrupted**:
   - Backup current database
   - Delete `hostprint.db`
   - Restart app (creates fresh database)
   - Restore from backup if possible

### Does standalone mode require any network access?

**Only for printing.** The backend itself requires no internet. Network access is only used when:
- Communicating with print hosts (LAN/WAN)
- Checking for app updates (optional, can be disabled)

### Can I run multiple Macs in standalone mode with the same hosts?

**Yes, but manually.** Each Mac operates independently. To keep configurations synchronized:
- Export hosts from one Mac
- Import to another Mac
- Or use hybrid mode for automatic sync

### What's the performance difference between SQLite (standalone) and PostgreSQL (hybrid)?

**Negligible for typical use.** SQLite handles thousands of print jobs efficiently. PostgreSQL becomes beneficial only with:
- Concurrent access from multiple devices
- Complex reporting/analytics queries
- Millions of historical records

For single-user scenarios, standalone SQLite is perfectly sufficient.

---

## Summary

**Standalone mode makes HostPrint work completely offline and autonomously.** All features work locally, no cloud required. Perfect for privacy, offline use, or simple single-device setups.

**Ready to go standalone?** Open Preferences > Backend > Standalone Mode and you're set.

**Need sync later?** Switch to hybrid mode anytime — your data comes with you.
