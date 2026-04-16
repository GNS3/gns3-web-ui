# Web Wireshark Documentation

Welcome to the Web Wireshark feature documentation. This directory contains comprehensive documentation about the browser-based packet capture and analysis system in GNS3 Web UI.

## 📚 Documentation Index

### Getting Started
1. **[Overview](./overview.md)** ⭐ START HERE
   - Executive summary and feature introduction
   - Architecture overview
   - Core business scenarios
   - Component descriptions
   - API endpoints and WebSocket communication
   - User interface guide
   - Error handling and troubleshooting

2. **[Business Flow & Architecture](./business-flow.md)**
   - Detailed business flows with sequence diagrams
   - State management models
   - Component interaction patterns
   - Data flow diagrams
   - Security and authentication flows
   - Performance considerations

3. **[Architecture Diagrams](./diagrams/architecture-overview.md)**
   - System architecture diagrams
   - Component hierarchy trees
   - Service layer architecture
   - Data flow visualizations
   - State management diagrams
   - Integration points

### Implementation Details
4. **[Source Code](../../README.md)**
   - Component: `src/app/components/project-map/web-wireshark-inline/`
   - Services: `src/app/services/xpra-console.service.ts`
   - Actions: `src/app/components/project-map/context-menu/actions/`

## 🎯 Quick Navigation

### For Users
- **New to Web Wireshark?** Start with [Overview](./overview.md)
- **Need help with errors?** See [Error Handling](./overview.md#error-handling) in Overview
- **Want to understand flows?** Check [Business Flow](./business-flow.md)

### For Developers
- **Architecture understanding?** Read [Architecture Diagrams](./diagrams/architecture-overview.md)
- **Component interactions?** Check [Component Interactions](./business-flow.md#component-interactions)
- **Source code?** See `src/app/components/project-map/web-wireshark-inline/`

### For Contributors
- **Want to contribute?** See [Future Enhancements](./overview.md#future-enhancements)
- **Testing?** See [Testing Scenarios](./business-flow.md#testing-scenarios)

## 🔑 Key Concepts

### What is Web Wireshark?
Web Wireshark is a browser-based packet capture and analysis tool that:
- Integrates seamlessly with GNS3 Web UI
- Requires no native software installation
- Provides real-time packet analysis
- Supports multiple concurrent captures
- Works across all modern browsers

### How Does It Work?
1. **Capture Start**: User starts packet capture on a link
2. **Backend Processing**: GNS3 controller starts tcpdump on compute node
3. **WebSocket Stream**: Packet data streamed via WebSocket
4. **Browser Display**: xpra-html5 client displays packets in Wireshark interface
5. **Real-time Analysis**: Users analyze packets as they arrive

### Display Modes
- **New Tab**: Opens in separate browser tab (full-screen experience)
- **Inline Window**: Opens as draggable window on project map (multi-link comparison)

## 📋 Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Start/stop capture | ✅ Complete | REST API integration |
| Web Wireshark (new tab) | ✅ Complete | Opens in browser tab |
| Web Wireshark (inline) | ✅ Complete | Draggable, resizable, minimizable |
| Real-time packet streaming | ✅ Complete | WebSocket-based |
| Multiple concurrent captures | ✅ Complete | No limit enforced |
| Window management | ✅ Complete | Z-index, minimize, restore |
| Restart capture | ✅ Complete | Reload WebSocket connection |
| Packet filters | ⏳ Planned | BPF filter input |
| Capture statistics | ⏳ Planned | Real-time metrics |
| Export captures | ⏳ Planned | Download pcap files |

## 🔧 Technical Stack

### Frontend
- **Framework**: Angular 21 (Zoneless)
- **UI Library**: Angular Material 21
- **State Management**: Signals
- **WebSocket**: Native browser WebSocket API

### Backend
- **Controller**: GNS3 Controller (Python)
- **Compute**: Docker/QEMU VMs
- **Capture**: tcpdump
- **WebSocket**: GNS3 Controller WebSocket server

### Third-Party
- **xpra-html5**: Web-based display client
- **Wireshark**: Packet analysis interface (via xpra-html5)

## 📖 Related Documentation

### GNS3 Documentation
- [Packet Capturing Guide](../../README.md)
- [Context Menu System](../context-menu.md)
- [Project Map Component](../../README.md)

### External Resources
- [Wireshark Documentation](https://www.wireshark.org/docs/)
- [xpra-html5 GitHub](https://github.com/Xpra-org/xpra-html5)
- [libpcap Format](https://wiki.wireshark.org/Development/LibpcapFileFormat)

### API Documentation
- [GNS3 Controller API](https://api.gns3.net/)
- [WebSocket Endpoints](https://api.gns3.net/en/latest/ws.html)

## 🐛 Troubleshooting

### Common Issues

**Issue**: Web Wireshark shows no packets
- **Solution**: Check if link is capturing (green indicator)
- **See**: [Troubleshooting Guide](./overview.md#issue-web-wireshark-shows-no-packets)

**Issue**: Inline window not draggable
- **Solution**: Close and reopen window
- **See**: [Troubleshooting Guide](./overview.md#issue-inline-window-not-draggable)

**Issue**: WebSocket connection failed
- **Solution**: Verify controller URL and auth token
- **See**: [Error Handling](./overview.md#error-handling)

## 🚀 Getting Started

### For Users

1. **Start a capture**
   - Right-click on a link
   - Select "Start Capture"
   - Check "Web Wireshark"
   - Click "Start"

2. **Open Web Wireshark**
   - Right-click on capturing link
   - Select "Open Web Wireshark (Inline)"
   - View packets in real-time

3. **Stop capture**
   - Right-click on capturing link
   - Select "Stop Capture"

### For Developers

1. **Explore the code**
   - Components: `src/app/components/project-map/web-wireshark-inline/`
   - Services: `src/app/services/xpra-console.service.ts`
   - Actions: `src/app/components/project-map/context-menu/actions/`

2. **Run the application**
   ```bash
   yarn install
   yarn ng serve
   ```

3. **Start capturing**
   - Create a project with running nodes
   - Start capture on a link
   - Open Web Wireshark

## 📝 Document Metadata

| Document | Version | Last Updated | Maintainer |
|----------|---------|--------------|------------|
| Overview | 1.0.0 | 2026-04-11 | GNS3 Web UI Team |
| Business Flow | 1.0.0 | 2026-04-11 | GNS3 Web UI Team |
| Architecture Diagrams | 1.0.0 | 2026-04-11 | GNS3 Web UI Team |
| Inline Display Implementation | 1.0.0 | 2026-04-11 | GNS3 Web UI Team |

## 🤝 Contributing

Contributions to Web Wireshark documentation are welcome! Please:

1. Follow the existing documentation structure
2. Use clear, concise language
3. Include diagrams where helpful
4. Update metadata (version, date)
5. Proofread for clarity and accuracy

## 📧 Support

For questions, issues, or suggestions:
- **GitHub Issues**: [GNS3 Web UI Issues](https://github.com/GNS3/gns3-web-ui/issues)
- **Documentation**: See troubleshooting guides above
- **Community**: [GNS3 Forums](https://community.gns3.com)

---

**Last Updated**: 2026-04-11  
**Documentation Version**: 1.0.0  
**Maintained By**: GNS3 Web UI Team

---

## License

This documentation is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).
