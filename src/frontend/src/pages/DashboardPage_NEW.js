import React, { useEffect, useState } from 'react';
import '../styles/theme.css';
import '../styles/dashboard.css';
import { cargarConfigWidgets } from '../services/widgetsService';

function DashboardPage() {
  const [widgetsCfg, setWidgetsCfg] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await cargarConfigWidgets();
        const arr = Array.isArray(data?.widgets) ? data.widgets : [];
        setWidgetsCfg(arr);
        localStorage.setItem('domoticx.widgets', JSON.stringify(arr));
      } catch (e) {
        const cached = localStorage.getItem('domoticx.widgets');
        if (cached) {
          try {
            setWidgetsCfg(JSON.parse(cached) || []);
          } catch {
            setWidgetsCfg([]);
          }
        } else {
          setWidgetsCfg([]);
        }
      }
    })();
  }, []);

  const renderWidget = () => null;

  return (
    <div className="dashboard-container">
      <div className="widgets-grid">
        {widgetsCfg && widgetsCfg.length > 0 && widgetsCfg
          .filter(w => w.visible !== false)
          .sort((a,b) => (a.orden ?? 0) - (b.orden ?? 0))
          .map(w => {
            const el = renderWidget(w);
            return el ? (
              <div key={w.tipo + '-' + w.id} className="widget">{el}</div>
            ) : null;
          })}
      </div>
    </div>
  );
}

export default DashboardPage;
