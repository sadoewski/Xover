import ProfessionalLayout from '../components/ProfessionalLayout';
import XoverTerminal from '../components/XoverTerminal';
import './TerminalPage.css';

export default function TerminalPage() {
  return (
    <ProfessionalLayout>
      <div className="terminal-page">
        <XoverTerminal />
      </div>
    </ProfessionalLayout>
  );
}
