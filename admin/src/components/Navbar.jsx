import React from 'react';
import { Zap, Calendar, Video, ScrollText, LayoutDashboard, Megaphone, BadgeCheck } from 'lucide-react';

export default function Navbar({
  department,
  activeTab,
  onSelectTab,
  queueCount,
  scheduledCount,
  pendingBoonCount = 0,
  isInCall
}) {
  const boardingTabs = (
    <>
      <button className={`nav-tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => onSelectTab('queue')} type="button">
        <Zap size={16} />
        <span>Instant Queue</span>
        <span className="tab-badge">{queueCount}</span>
      </button>
      <button className={`nav-tab ${activeTab === 'scheduled' ? 'active' : ''}`} onClick={() => onSelectTab('scheduled')} type="button">
        <Calendar size={16} />
        <span>Scheduled Slots</span>
        <span className="tab-badge">{scheduledCount}</span>
      </button>
      <button className={`nav-tab ${activeTab === 'boons' ? 'active' : ''}`} onClick={() => onSelectTab('boons')} type="button">
        <BadgeCheck size={16} />
        <span>Boon Approvals</span>
        <span className="tab-badge">{pendingBoonCount}</span>
      </button>
      <button className={`nav-tab ${activeTab === 'room' ? 'active' : ''}`} onClick={() => onSelectTab('room')} type="button">
        <Video size={16} />
        <span>Live Assessment Room</span>
        {isInCall && <span className="live-tag">LIVE</span>}
      </button>
      <button className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => onSelectTab('history')} type="button">
        <ScrollText size={16} />
        <span>Evaluation Log</span>
      </button>
    </>
  );

  const adminTabs = (
    <>
      <button className={`nav-tab ${activeTab === 'monitor' ? 'active' : ''}`} onClick={() => onSelectTab('monitor')} type="button">
        <LayoutDashboard size={16} />
        <span>Monitor</span>
        <span className="tab-badge">{queueCount + scheduledCount}</span>
      </button>
      {boardingTabs}
    </>
  );

  const marketingTabs = (
    <>
      <button className={`nav-tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => onSelectTab('queue')} type="button">
        <Zap size={16} />
        <span>Instant Queue</span>
        <span className="tab-badge">{queueCount}</span>
      </button>
      <button className={`nav-tab ${activeTab === 'scheduled' ? 'active' : ''}`} onClick={() => onSelectTab('scheduled')} type="button">
        <Calendar size={16} />
        <span>Scheduled</span>
        <span className="tab-badge">{scheduledCount}</span>
      </button>
      <button className={`nav-tab ${activeTab === 'boons' ? 'active' : ''}`} onClick={() => onSelectTab('boons')} type="button">
        <BadgeCheck size={16} />
        <span>Boons</span>
        <span className="tab-badge">{pendingBoonCount}</span>
      </button>
      <button className={`nav-tab ${activeTab === 'room' ? 'active' : ''}`} onClick={() => onSelectTab('room')} type="button">
        <Video size={16} />
        <span>Live Call</span>
        {isInCall && <span className="live-tag">LIVE</span>}
      </button>
      <button className={`nav-tab ${activeTab === 'marketing' ? 'active' : ''}`} onClick={() => onSelectTab('marketing')} type="button">
        <Megaphone size={16} />
        <span>Overview</span>
      </button>
      <button className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => onSelectTab('history')} type="button">
        <ScrollText size={16} />
        <span>Certified</span>
      </button>
    </>
  );

  return (
    <nav className="admin-nav">
      {department === 'admin' && adminTabs}
      {department === 'marketing' && marketingTabs}
      {department === 'boarding' && boardingTabs}
    </nav>
  );
}
