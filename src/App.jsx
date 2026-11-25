import DailyPlan from "./DailyPlan.jsx";
import ChatAssistant from "./ChatAssistant.jsx";
import { useState, useEffect } from "react";
import React from "react";
import {
  Wind, LayoutDashboard, Bot, House, Leaf, MapPin,
  ShieldCheck, Activity, ArrowUpRight, ArrowRight,
  Sun, Search, Bell, Menu, X, Clock, CarFront,
  CircleAlert, Heart, Sparkles, RefreshCw
} from "lucide-react";
import "./App.css";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "AI Assistant", icon: Bot },
  { label: "Daily Plan", icon: Sparkles },
  { label: "Indoor Air", icon: House },
  { label: "Eco Impact", icon: Leaf }
];

function getAQIStatus(value) {
  if (value <= 50) return "Good";
  if (value <= 100) return "Moderate";
  if (value <= 150) return "Unhealthy for Sensitive Groups";
  if (value <= 200) return "Unhealthy";
  if (value <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function getAQIColor(value) {
  if (value <= 50) return "#16a34a";
  if (value <= 100) return "#eab308";
  if (value <= 150) return "#f97316";
  if (value <= 200) return "#ef4444";
  if (value <= 300) return "#9333ea";
  return "#7f1d1d";
}

function getAQIAdvice(value) {
  if (value <= 50) {
    return {
      risk: "Low Risk",
      title: "Air quality is excellent",
      message: "It's a great day to enjoy outdoor activities.",
      outdoor: "Enjoy outdoor activities",
      recommendations: [
        {
          icon: Activity,
          title: "Enjoy outdoor exercise",
          desc: "Outdoor workouts and walks are generally suitable.",
          tag: "FITNESS",
          color: "green"
        },
        {
          icon: House,
          title: "Ventilate your home",
          desc: "Fresh outdoor air can help ventilate your indoor space.",
          tag: "HOME",
          color: "blue"
        },
        {
          icon: ShieldCheck,
          title: "Stay aware",
          desc: "Continue monitoring air quality as conditions change.",
          tag: "PREVENTION",
          color: "purple"
        }
      ]
    };
  }

  if (value <= 100) {
    return {
      risk: "Moderate Risk",
      title: "Air quality is acceptable",
      message: "Most people can continue normal activities.",
      outdoor: "Normal activities are generally okay",
      recommendations: [
        {
          icon: Activity,
          title: "Continue outdoor activities",
          desc: "Most people can exercise outdoors normally.",
          tag: "FITNESS",
          color: "green"
        },
        {
          icon: Heart,
          title: "Sensitive people take care",
          desc: "People sensitive to pollution may notice symptoms.",
          tag: "HEALTH",
          color: "purple"
        },
        {
          icon: House,
          title: "Monitor air conditions",
          desc: "Check AQI before planning longer outdoor activities.",
          tag: "AWARENESS",
          color: "blue"
        }
      ]
    };
  }

  if (value <= 150) {
    return {
      risk: "Elevated Risk",
      title: "Sensitive groups should take care",
      message: "Children, older adults and sensitive people should reduce prolonged outdoor exposure.",
      outdoor: "Reduce prolonged outdoor exercise",
      recommendations: [
        {
          icon: ShieldCheck,
          title: "Protect sensitive groups",
          desc: "Sensitive people should limit prolonged outdoor exposure.",
          tag: "PRIORITY",
          color: "green"
        },
        {
          icon: Activity,
          title: "Reduce outdoor workouts",
          desc: "Choose lighter activity or exercise indoors.",
          tag: "FITNESS",
          color: "purple"
        },
        {
          icon: House,
          title: "Keep indoor air cleaner",
          desc: "Close windows during periods of higher pollution.",
          tag: "HOME",
          color: "blue"
        }
      ]
    };
  }

  if (value <= 200) {
    return {
      risk: "High Risk",
      title: "Air quality is unhealthy",
      message: "Everyone may begin experiencing health effects. Reduce outdoor exposure.",
      outdoor: "Avoid strenuous outdoor activities",
      recommendations: [
        {
          icon: ShieldCheck,
          title: "Use a well-fitting N95",
          desc: "Consider a respirator when outdoor exposure is necessary.",
          tag: "PROTECTION",
          color: "green"
        },
        {
          icon: Activity,
          title: "Move workouts indoors",
          desc: "Avoid intense outdoor exercise.",
          tag: "FITNESS",
          color: "purple"
        },
        {
          icon: House,
          title: "Close windows",
          desc: "Reduce entry of outdoor pollution into your home.",
          tag: "HOME",
          color: "blue"
        }
      ]
    };
  }

  if (value <= 300) {
    return {
      risk: "Very High Risk",
      title: "Air quality is very unhealthy",
      message: "Health alert: reduce outdoor exposure as much as possible.",
      outdoor: "Avoid outdoor activities",
      recommendations: [
        {
          icon: ShieldCheck,
          title: "Avoid unnecessary exposure",
          desc: "Stay indoors as much as possible.",
          tag: "PRIORITY",
          color: "green"
        },
        {
          icon: House,
          title: "Protect indoor air",
          desc: "Keep windows closed and use filtration if available.",
          tag: "HOME",
          color: "blue"
        },
        {
          icon: Activity,
          title: "Skip outdoor workouts",
          desc: "Avoid strenuous physical activity outdoors.",
          tag: "FITNESS",
          color: "purple"
        }
      ]
    };
  }

  return {
    risk: "Severe Risk",
    title: "Hazardous air conditions",
    message: "Avoid outdoor exposure. Follow local health advisories.",
    outdoor: "Stay indoors",
    recommendations: [
      {
        icon: ShieldCheck,
        title: "Stay indoors",
        desc: "Avoid outdoor exposure wherever possible.",
        tag: "PRIORITY",
        color: "green"
      },
      {
        icon: House,
        title: "Seal and filter indoor air",
        desc: "Keep windows closed and use effective filtration if available.",
        tag: "HOME",
        color: "blue"
      },
      {
        icon: Activity,
        title: "Avoid physical exertion",
        desc: "Do not perform strenuous outdoor activities.",
        tag: "FITNESS",
        color: "purple"
      }
    ]
  };
}


function EcoImpact() {
  const [days, setDays] = useState(0);
  const [walk, setWalk] = useState(false);
  const [transit, setTransit] = useState(false);
  const [plant, setPlant] = useState(false);
  const score = (walk ? 1 : 0) + (transit ? 2 : 0) + (plant ? 1 : 0);
  return <section style={{padding:24}} className="recommendation-section"><div className="eyebrow">SUSTAINABLE HABITS</div><h1>Eco Impact Tracker</h1><p>Track simple actions locally in this session. Estimates are illustrative and not verified emissions calculations.</p><div className="recommendation-grid">{[{key:'walk',title:'Walk or cycle short trips',desc:'Choose active travel for a short trip when safe and practical.'},{key:'transit',title:'Use public transport or carpool',desc:'Reduce solo car trips when a suitable alternative is available.'},{key:'plant',title:'Reduce energy and waste',desc:'Switch off unused equipment, reuse items and avoid unnecessary waste.'}].map((item)=><article className="recommendation-card" key={item.key}><h3>{item.title}</h3><p>{item.desc}</p><label style={{display:'flex',gap:8,alignItems:'center',marginTop:12}}><input type="checkbox" checked={item.key==='walk'?walk:item.key==='transit'?transit:plant} onChange={e=>item.key==='walk'?setWalk(e.target.checked):item.key==='transit'?setTransit(e.target.checked):setPlant(e.target.checked)}/>Completed today</label></article>)}</div><div style={{marginTop:24,padding:22,borderRadius:18,background:'rgba(22,163,74,.08)'}}><h2>{score}/4 habit points</h2><p>{score===0?'Start with one small habit today.':score===1?'Nice start—one positive action logged.':score===2?'Two actions checked—keep the momentum.':score===3?'Great choices today!':'Strong sustainable habit day.'}</p><button className="action-link" onClick={()=>{setWalk(false);setTransit(false);setPlant(false);}}>Reset today's checklist</button></div></section>;
}

function App() {
  const [active, setActive] = useState("Overview");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [aqiData, setAqiData] = useState(null);
  const [aqiLoading, setAqiLoading] = useState(true);
  const [aqiError, setAqiError] = useState(false);

  const [locationName, setLocationName] = useState("New Delhi, India");
  const [coordinates, setCoordinates] = useState({
    latitude: 28.6139,
    longitude: 77.2090
  });

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  async function fetchAQI(latitude, longitude) {
    setAqiLoading(true);
    setAqiError(false);
    try {
      const response = await fetch(`http://localhost:5000/api/aqi?lat=${latitude}&lon=${longitude}&label=${encodeURIComponent(locationName)}`);
      if (!response.ok) throw new Error("AQI fetch failed");
      const data = await response.json();
      if (data.error || data.aqi == null) throw new Error(data.error || "AQI unavailable");
      setAqiData(data);
    } catch (error) {
      console.error("AQI Error:", error);
      setAqiData(null);
      setAqiError(true);
    } finally {
      setAqiLoading(false);
    }
  }

  useEffect(() => {
    fetchAQI(coordinates.latitude, coordinates.longitude);
  }, []);

  async function searchCity() {
    const query = window.prompt("Enter a city or location (e.g. Delhi, India):");
    if (!query || !query.trim()) return;
    setAqiLoading(true); setAqiError(false); setLocationError("");
    try {
      const response = await fetch(`http://localhost:5000/api/aqi?location=${encodeURIComponent(query.trim())}`);
      if (!response.ok) throw new Error("Location search failed");
      const data = await response.json();
      if (data.error || data.aqi == null) throw new Error(data.error || "AQI unavailable");
      setAqiData(data); setLocationName(data.location || query.trim());
      if (Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) setCoordinates({latitude:data.latitude,longitude:data.longitude});
    } catch (e) { setLocationError(e.message || "Could not search this location."); setAqiData(null); setAqiError(true); }
    finally { setAqiLoading(false); }
  }

  async function detectLocation() {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location detection.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setCoordinates({ latitude, longitude });

        setLocationName(
          `Lat ${latitude.toFixed(3)}, Lon ${longitude.toFixed(3)}`
        );

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (response.ok) {
            const locationData = await response.json();
            const address = locationData.address || {};

            const city =
              address.city ||
              address.town ||
              address.village ||
              address.suburb ||
              address.county ||
              address.state ||
              "Your Location";

            const country = address.country || "";

            setLocationName(`${city}${country ? ", " + country : ""}`);
          }
        } catch (error) {
          console.log("Location name unavailable.");
        }

        await fetchAQI(latitude, longitude);
        setLocationLoading(false);
      },
      (error) => {
        console.error("Location error:", error);

        setLocationError(
          error.code === 1
            ? "Location permission denied. Please allow location access."
            : "Unable to detect your location."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  const currentAQI = aqiData?.aqi ?? null;
  const aqiStatus = aqiData ? (aqiData.category || getAQIStatus(currentAQI)) : "--";
  const aqiColor = aqiData ? getAQIColor(currentAQI) : "#64748b";
  const advice = aqiData ? getAQIAdvice(currentAQI) : null;

  const markerPosition = currentAQI == null ? 0 : Math.min(Math.max(currentAQI / 500 * 100, 0), 100);

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Wind size={23} />
          </div>

          <div>
            <h2>AirCare<span>AI</span></h2>
            <small>Breathe smarter.</small>
          </div>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
          >
            <X />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                setActive(label);
                setMobileMenu(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>

              {label === "AI Assistant" && (
                <Sparkles size={14} className="nav-spark" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <Leaf size={20} />
            <h4>Small actions matter.</h4>
            <p>
              Better choices today can help build cleaner communities.
            </p>
          </div>

          <div className="profile">
            <div className="avatar">AC</div>
            <div>
              <strong>AirCare User</strong>
              <small>Personal dashboard</small>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <div
          className="menu-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileMenu(true)}
          >
            <Menu />
          </button>

          <div className="location">
            <MapPin size={17} />

            <div>
              <small>YOUR LOCATION</small>
              <strong>{locationName}</strong>
            </div>
          </div>

          <div className="top-actions">

            <button
              className="detect-location-button"
              onClick={detectLocation}
              disabled={locationLoading}
            >
              <MapPin size={16} />
              {locationLoading ? "Detecting..." : "Detect Location"}
            </button>

            <div className="live-indicator">
              <span className="live-dot" />
              LIVE AQI
            </div>

            <button className="icon-button" title="Notifications" onClick={() => window.alert("AirCare AI alerts are currently shown through the AQI dashboard and daily guidance. Push notifications are not enabled yet.")}>
              <Bell size={19} />
            </button>

            <button className="icon-button" title="Search location" onClick={searchCity}>
              <Search size={19} />
            </button>
          </div>
        </header>

        {locationError && (
          <div className="location-error-message">
            {locationError}
          </div>
        )}

        {/* OVERVIEW */}

        {active === "Overview" && (
          <>

            {/* HERO */}

            <section className="welcome">
              <div>
                <div className="eyebrow">
                  YOUR PERSONAL AIR COMPANION
                </div>

                <h1>
                  Breathe smarter.<br />
                  <span>Live healthier.</span>
                </h1>

                <p>
                  Understand your air. Protect your health.
                  Make better everyday choices.
                </p>
              </div>

              <div className="welcome-art">
                <div className="orb">
                  <Wind size={65} strokeWidth={1.3} />
                </div>
              </div>
            </section>

            {/* AQI SECTION */}

            <section className="aqi-grid">

              <div className="aqi-card">

                <div className="aqi-header">
                  <div>
                    <span className="card-label">
                      AIR QUALITY INDEX
                    </span>

                    <h2>Current air conditions</h2>
                  </div>

                  <div className="aqi-badge">
                    LIVE
                  </div>
                </div>

                <div className="aqi-main">

                  <div
                    className="aqi-number"
                    style={{
                      color: aqiLoading || aqiError
                        ? "inherit"
                        : aqiColor
                    }}
                  >
                    {aqiLoading
                      ? "..."
                      : aqiError
                      ? "--"
                      : currentAQI}
                  </div>

                  <div className="aqi-status">

                    <CircleAlert
                      size={20}
                      color={aqiColor}
                    />

                    <strong
                      style={{
                        color: aqiLoading || aqiError
                          ? "inherit"
                          : aqiColor
                      }}
                    >
                      {aqiError
                        ? "Unavailable"
                        : aqiLoading
                        ? "Loading..."
                        : aqiStatus}
                    </strong>

                    <span>
                      {aqiData?.dataType || "AQI scale/source unavailable"}
                    </span>

                  </div>
                </div>

                <div style={{fontSize:12,marginTop:12,opacity:.75,display:'flex',flexWrap:'wrap',gap:8}}>
                  <span>Source: {aqiData?.dataSource || "--"}</span><span>•</span>
                  <span>Updated: {aqiData?.readingTime || "--"}</span>
                  {aqiData?.fallbackReason && <span>• {aqiData.fallbackReason}</span>}
                </div>

                {/* AQI SCALE */}

                <div className="aqi-scale">

                  <div className="scale-bar">
                    <div
                      className="scale-marker"
                      style={{
                        left: `${markerPosition}%`,
                        background: aqiColor
                      }}
                    />
                  </div>

                  <div className="scale-labels">
                    <span>Good</span>
                    <span>Moderate</span>
                    <span>Poor</span>
                    <span>Severe</span>
                  </div>

                  <div className="scale-range-labels">
                    <span>0</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                    <span>500</span>
                  </div>

                </div>

                {/* AQI DATA FOOTER */}

                <div className="aqi-footer">

                  <div>
                    <span>PM2.5</span>
                    <strong>
                      {aqiLoading
                        ? "..."
                        : aqiError
                        ? "--"
                        : `${aqiData?.pm25 ?? "--"} μg/m³`}
                    </strong>
                  </div>

                  <div>
                    <span>Outdoor activity</span>
                    <strong>
                      {aqiLoading || aqiError
                        ? "--"
                        : advice?.outdoor}
                    </strong>
                  </div>

                  <div>
                    <span>Health risk</span>
                    <strong
                      style={{
                        color: aqiLoading || aqiError
                          ? "inherit"
                          : aqiColor
                      }}
                    >
                      {aqiLoading || aqiError
                        ? "--"
                        : advice?.risk}
                    </strong>
                  </div>

                </div>

                {/* REFRESH BUTTON */}

                <button
                  className="aqi-refresh-button"
                  onClick={() =>
                    fetchAQI(
                      coordinates.latitude,
                      coordinates.longitude
                    )
                  }
                  disabled={aqiLoading}
                >
                  <RefreshCw
                    size={16}
                    className={aqiLoading ? "refresh-spin" : ""}
                  />

                  {aqiLoading
                    ? "Updating air quality..."
                    : "Refresh AQI"}
                </button>

              </div>

              {/* WEATHER CARD */}

              <div className="weather-card">

                <div className="card-label">
                  LOCAL CONDITIONS
                </div>

                <div className="weather-icon">
                  <Sun size={40} />
                </div>

                <div className="weather-temp">
                  --
                </div>

                <div className="weather-desc">
                  Weather integration pending
                </div>

                <div className="weather-divider" />

                <div className="weather-detail">
                  <Wind size={17} />
                  <span>Air quality</span>
                  <strong
                    style={{
                      color: aqiLoading || aqiError
                        ? "inherit"
                        : aqiColor
                    }}
                  >
                    {aqiLoading
                      ? "Loading"
                      : aqiError
                      ? "Unavailable"
                      : aqiStatus}
                  </strong>
                </div>

                <div className="weather-detail">
                  <Activity size={17} />
                  <span>PM2.5</span>
                  <strong>
                    {aqiLoading
                      ? "..."
                      : aqiError
                      ? "--"
                      : `${aqiData?.pm25 ?? "--"} μg/m³`}
                  </strong>
                </div>

              </div>

            </section>

            {/* PROTECTION PLAN */}

            <section className="section-heading">

              <div>
                <div className="eyebrow">
                  PERSONALIZED FOR TODAY
                </div>

                <h2>Your protection plan</h2>

                <p>
                  Recommendations based on current air quality.
                </p>
              </div>

              <button
                className="view-button"
                onClick={() => setActive("Daily Plan")}
              >
                Today's plan
                <ArrowRight size={16} />
              </button>

            </section>

            {/* DYNAMIC ACTION CARDS */}

            <section className="action-grid">

              {aqiLoading ? (
                <div className="action-card">
                  <h3>Loading recommendations...</h3>
                  <p>Checking your current air quality.</p>
                </div>
              ) : aqiError ? (
                <div className="action-card">
                  <h3>Recommendations unavailable</h3>
                  <p>Refresh AQI to generate recommendations.</p>
                </div>
              ) : (
                advice?.recommendations.map(
                  ({ icon: Icon, title, desc, tag, color }) => (
                    <div
                      className="action-card"
                      key={title}
                    >
                      <div className={`action-icon ${color}`}>
                        <Icon size={22} />
                      </div>

                      <div className="action-tag">
                        {tag}
                      </div>

                      <h3>{title}</h3>

                      <p>{desc}</p>

                      <button
                        className="action-link"
                        onClick={() => setActive("AI Assistant")}
                      >
                        Why this matters
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  )
                )
              )}

            </section>

            {/* HEALTH SUMMARY */}

            {!aqiLoading && !aqiError && advice && (
              <section
                className="dashboard-health-card"
                style={{
                  borderLeft: `4px solid ${aqiColor}`
                }}
              >
                <div className="dashboard-health-icon">
                  <Heart size={24} color={aqiColor} />
                </div>

                <div className="dashboard-health-content">
                  <span className="eyebrow">
                    AIR QUALITY HEALTH ALERT
                  </span>

                  <h3 style={{ color: aqiColor }}>
                    {advice.title}
                  </h3>

                  <p>
                    {advice.message}
                  </p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setActive("Daily Plan")}
                >
                  Get health plan
                  <ArrowRight size={16} />
                </button>
              </section>
            )}

            {/* AI + ECO */}

            <section className="bottom-grid">

              <div className="assistant-card">

                <div className="assistant-top">
                  <div className="ai-icon">
                    <Bot size={23} />
                  </div>

                  <span className="ai-label">
                    <Sparkles size={14} />
                    AI POWERED
                  </span>
                </div>

                <h2>
                  Your air quality<br />
                  questions, answered.
                </h2>

                <p>
                  Get personalized advice about pollution,
                  routines, travel and protecting your family.
                </p>

                <button
                  className="primary-button"
                  onClick={() => setActive("AI Assistant")}
                >
                  Talk to AirCare AI
                  <ArrowRight size={17} />
                </button>

                <div className="assistant-decoration">
                  <Wind size={80} />
                </div>

              </div>

              <div className="impact-card">

                <div className="impact-header">
                  <div>
                    <div className="eyebrow">
                      SUSTAINABLE LIVING
                    </div>

                    <h2>Your eco impact</h2>
                  </div>

                  <Leaf size={22} className="leaf-icon" />
                </div>

                <p>
                  Small daily changes can create meaningful
                  collective impact.
                </p>

                <div className="impact-stat">
                  <div className="impact-icon">
                    <CarFront size={20} />
                  </div>

                  <div>
                    <strong>Cleaner commuting</strong>
                    <small>
                      Try public transport or carpooling.
                    </small>
                  </div>
                </div>

                <div className="impact-stat">
                  <div className="impact-icon">
                    <House size={20} />
                  </div>

                  <div>
                    <strong>Cleaner indoor habits</strong>
                    <small>
                      Reduce unnecessary smoke and particles.
                    </small>
                  </div>
                </div>

                <button
                  className="action-link"
                  onClick={() => setActive("Eco Impact")}
                >
                  Explore your impact
                  <ArrowRight size={16} />
                </button>

              </div>

            </section>

            <footer>
              <span>AirCare AI</span>
              <span>
                Environmental awareness & personal guidance
              </span>
            </footer>

          </>
        )}

        {/* AI ASSISTANT */}

        {active === "AI Assistant" && (
  <ChatAssistant
    currentAQI={aqiData?.aqi}
    pm25={aqiData?.pm25}
    location={locationName}
    aqiStatus={aqiStatus}
    dataSource={aqiData?.dataSource}
    dataType={aqiData?.dataType}
    readingTime={aqiData?.readingTime}
  />
)}
        

        {/* DAILY PLAN */}

        {active === "Daily Plan" && (
          <DailyPlan
            aqi={aqiData?.aqi}
            pm25={aqiData?.pm25}
            loading={aqiLoading}
            error={aqiError}
            location={locationName}
            source={aqiData?.dataSource}
            dataType={aqiData?.dataType}
          />
        )}

        {/* OTHER MODULES */}

        {active === "Indoor Air" && (
          <section className="recommendation-section" style={{padding:24}}>
            <div className="eyebrow">HOME ENVIRONMENT</div><h1>Indoor Air Toolkit</h1>
            <p>Practical actions to reduce indoor particle exposure. These are guidance tools, not sensor measurements.</p>
            <div className="recommendation-grid">
              {[{title:"Ventilation timing",desc:"Ventilate when outdoor air is cleaner. Avoid opening windows during nearby smoke, dust or high-pollution periods."},{title:"Reduce indoor sources",desc:"Avoid smoking indoors, incense, aerosol sprays and unnecessary combustion. Use kitchen exhaust while cooking."},{title:"Filtration",desc:"If available, use a properly sized HEPA air cleaner and maintain its filters as instructed."},{title:"Cleaning",desc:"Damp-dust surfaces and vacuum with a HEPA-filtered vacuum when available. Avoid stirring settled dust."},{title:"Cooking",desc:"Use exhaust ventilation, keep burners maintained and limit frying or smoke-generating cooking when possible."},{title:"Room checklist",desc:"Keep a simple routine: check outdoor air, ventilate strategically, reduce sources and maintain filtration."}].map((item,i)=><article key={i} className="recommendation-card"><div className="recommendation-icon"><House size={20}/></div><h3>{item.title}</h3><p>{item.desc}</p></article>)}
            </div>
            <div style={{marginTop:20,padding:18,borderRadius:16,background:"rgba(22,163,74,.08)"}}><strong>Important:</strong> AirCare AI does not currently measure indoor air directly. Indoor recommendations are based on general guidance.</div>
          </section>
        )}

        {active === "Eco Impact" && (
          <EcoImpact />
        )}

      </main>
    </div>
  );
}

export default App;