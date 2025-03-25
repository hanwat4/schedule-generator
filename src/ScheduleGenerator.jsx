// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { addDays, format, isWeekend, parseISO, isBefore, isAfter, isSameDay, eachDayOfInterval, differenceInDays } from 'date-fns';

function App() {




  // -------------- STATE DEFINITIONS --------------- //

  const [buildTypes, setBuildTypes] = useState([
    { id: 'P1', name: 'P1', date: '' },
    { id: 'P2', name: 'P2', date: '' },
    { id: 'EVT', name: 'EVT', date: '' },
    { id: 'DVT', name: 'DVT', date: '' },
    { id: 'PVT', name: 'PVT', date: '' }
  ]);

  // Add a state for new build type
  const [newBuildType, setNewBuildType] = useState({
    name: '',
    date: ''
  });
  
  // Holiday states
  const [usHolidays, setUsHolidays] = useState([]);
  const [chinaHolidays, setChinaHolidays] = useState([]);

  // Generated schedule states
  const [schedules, setSchedules] = useState({});

  // Custom events
  const [customEvents, setCustomEvents] = useState([]);
  const [newCustomEvent, setNewCustomEvent] = useState({
    name: '',
    date: '',
    buildType: 'P1' // Default to P1, can be changed by user
  });

  // Lead times
  const [leadTimes, setLeadTimes] = useState({
    systemMIHToSystemBuild: 20, // 4 weeks (20 business days)
    ok2SendToSystemMIH: 2,      // 2 business days
    ok2TestToOk2Send: 2,        // 2 business days
    ok2BuildToOk2Test: 5,       // 1 week (5 business days)
    ok2ToolToOk2Build: 40,      // 8 weeks (40 business days)
    cadReleaseToOk2Tool: 20     // 4 weeks (20 business days)
  });



  // ------------- EVENT HANDLERS AND HELPER FUNCTIONS -------------- //



  // const handleSystemDateChange = (buildTypeId, dateStr) => {
  //   setBuildTypes(prev => 
  //     prev.map(type => 
  //       type.id === buildTypeId 
  //         ? { ...type, date: dateStr } 
  //         : type
  //     )
  //   );
  // };

  const handleSystemDateChange = (buildTypeId, dateStr) => {
    try {
      setBuildTypes(prev => 
        prev.map(type => 
          type.id === buildTypeId 
            ? { ...type, date: dateStr } 
            : type
        )
      );
    } catch (error) {
      console.error('Error updating build date:', error);
    }
  };

  // Handle custom event input changes
  const handleCustomEventChange = (field, value) => {
    setNewCustomEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add a new custom event
  const addCustomEvent = () => {
    if (newCustomEvent.name && newCustomEvent.date) {
      try {
        const eventDate = parseISO(newCustomEvent.date);
        
        // Create the new event
        const newEvent = {
          id: Date.now(), // Generate a unique ID
          name: newCustomEvent.name,
          date: eventDate,
          buildType: newCustomEvent.buildType
        };
        
        // Add to custom events state
        setCustomEvents(prev => [...prev, newEvent]);
        
        // Reset the form
        setNewCustomEvent({
          name: '',
          date: '',
          buildType: 'P1'
        });
      } catch (error) {
        console.error('Error adding custom event:', error);
        alert('Please enter a valid date.');
      }
    }
  };

  // Remove a custom event
  const removeCustomEvent = (eventId) => {
    setCustomEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(date, 'MMM dd, yyyy');
  };
  
  const formatDateForTable = (date) => {
    if (!date) return 'N/A';
    return format(date, 'M/d/yyyy');
  };

  // Format date for timeline in M/d 
  const formatDateForTimeline = (date) => {
    if (!date) return 'N/A';
    return format(date, 'M/d');
  };

  // Get holiday name if it exists
  const getHolidayName = (date) => {
    if (!date) return null;
    
    // Check US holidays
    for (const holiday of usHolidays) {
      const startDate = parseISO(holiday.startDate);
      const endDate = parseISO(holiday.endDate);
      
      if (
        (isSameDay(date, startDate) || isAfter(date, startDate)) && 
        (isSameDay(date, endDate) || isBefore(date, endDate))
      ) {
        return holiday.name;
      }
    }
    
    // Check China holidays
    for (const holiday of chinaHolidays) {
      const startDate = parseISO(holiday.startDate);
      const endDate = parseISO(holiday.endDate);
      
      if (
        (isSameDay(date, startDate) || isAfter(date, startDate)) && 
        (isSameDay(date, endDate) || isBefore(date, endDate))
      ) {
        return holiday.name;
      }
    }
    
    return null;
  };

  // Helper function to add business days accounting for holidays
  const addBusinessDays = (date, days) => {
    if (!date) return null;
    
    let currentDate = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      currentDate = addDays(currentDate, 1);
      
      // Skip weekends and holidays
      if (!isWeekend(currentDate) && !isHolidayDate(currentDate)) {
        addedDays++;
      }
    }
    
    return currentDate;
  };

  // Helper function to subtract business days accounting for holidays
  const subtractBusinessDays = (date, days) => {
    if (!date) return null;
    
    let currentDate = new Date(date);
    let subtractedDays = 0;
    
    while (subtractedDays < days) {
      currentDate = addDays(currentDate, -1);
      
      // Skip weekends and holidays
      if (!isWeekend(currentDate) && !isHolidayDate(currentDate)) {
        subtractedDays++;
      }
    }
    
    return currentDate;
  };

  // Helper function to check if a date is within any holiday period
  const isHolidayDate = (date) => {
    if (!date) return false;
    
    const checkDate = typeof date === 'string' ? parseISO(date) : date;
    const dateString = format(checkDate, 'yyyy-MM-dd');
    
    // Check if date is within any US holiday period
    const isUsHoliday = usHolidays.some(holiday => {
      const startDate = parseISO(holiday.startDate);
      const endDate = parseISO(holiday.endDate);
      return (
        (isSameDay(checkDate, startDate) || isAfter(checkDate, startDate)) && 
        (isSameDay(checkDate, endDate) || isBefore(checkDate, endDate))
      );
    });
    
    // Check if date is within any China holiday period
    const isChinaHoliday = chinaHolidays.some(holiday => {
      const startDate = parseISO(holiday.startDate);
      const endDate = parseISO(holiday.endDate);
      return (
        (isSameDay(checkDate, startDate) || isAfter(checkDate, startDate)) && 
        (isSameDay(checkDate, endDate) || isBefore(checkDate, endDate))
      );
    });
    
    return isUsHoliday || isChinaHoliday;
  };

  // Update the getMonthsInRange function
  const getMonthsInRange = () => {
    const allDates = [];
    
    // Collect all dates from schedules
    Object.values(schedules).forEach(schedule => {
      Object.values(schedule).forEach(date => {
        if (date instanceof Date) {
          allDates.push(date);
        }
      });
    });
    
    if (allDates.length === 0) return [];
    
    // Find earliest and latest dates with padding
    const earliestDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const latestDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add padding of one month on each side for better visualization
    earliestDate.setMonth(earliestDate.getMonth() - 1);
    latestDate.setMonth(latestDate.getMonth() + 1);
    
    // Get array of all months between earliest and latest
    const months = [];
    let currentDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    
    while (isBefore(currentDate, latestDate) || isSameDay(currentDate, latestDate)) {
      months.push(new Date(currentDate));
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return months;
  };

  // getYearsAndMonthsInRange function
  const getYearsAndMonthsInRange = () => {
    const months = getMonthsInRange();
    if (months.length === 0) return {};
    
    // Group months by year
    const yearGroups = {};
    months.forEach(month => {
      const year = month.getFullYear();
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(month);
    });
    
    return yearGroups;
  };

  const downloadScheduleImage = () => {
    // Only proceed if we have schedules to download
    if (Object.keys(schedules).length === 0) {
      alert("No schedules to download. Please enter build dates first.");
      return;
    }
  
    // Get the timeline container element
    const timelineContainer = document.querySelector('.timeline-container');
    if (!timelineContainer) {
      alert("Timeline not found.");
      return;
    }
  
    // Use html2canvas to capture the timeline as an image
    import('html2canvas').then(html2canvasModule => {
      const html2canvas = html2canvasModule.default;
      
      html2canvas(timelineContainer, {
        backgroundColor: '#ffffff',
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        scale: 2, // Higher quality
      }).then(canvas => {
        // Convert the canvas to a data URL
        const imageUrl = canvas.toDataURL('image/png');
        
        // Create a download link and trigger the download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'module_schedule.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }).catch(error => {
      console.error('Error loading html2canvas:', error);
      alert('Failed to generate image. Please try again.');
    });
  };
  

  const calculatePosition = (date, months) => {
    if (!date || !months || months.length === 0) return 0;
    
    try {
      // Ensure date is a proper Date object
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date in calculatePosition:', date);
        return 0;
      }
      
      // Find which month our date belongs to
      const dateMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
      
      // Find index of the month in our months array
      const monthIndex = months.findIndex(month => 
        month && month.getFullYear() === dateMonth.getFullYear() && 
        month.getMonth() === dateMonth.getMonth()
      );
      
      if (monthIndex === -1) return 0; // Not found
      
      // Calculate position within the month (0-100%)
      const daysInMonth = new Date(dateMonth.getFullYear(), dateMonth.getMonth() + 1, 0).getDate();
      const dayPosition = (dateObj.getDate() - 1) / daysInMonth;
      
      // Calculate final position
      return ((monthIndex + dayPosition) / months.length) * 100;
    } catch (error) {
      console.error('Error in calculatePosition:', error);
      return 0; // Return default position in case of error
    }
  }



  // This function renders the timeline header with perfectly aligned years and months
  const renderTimelineHeader = () => {
    const months = getMonthsInRange();
    if (months.length === 0) return null;
    
    // Group months by year
    const yearGroups = {};
    months.forEach(month => {
      const year = month.getFullYear();
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(month);
    });
    
    // Calculate total number of columns in our grid 
    const totalColumns = months.length;
    
    
    return (
      <div className="timeline-header-container">
        {/* Create a CSS grid with exactly one column per month */}
        <div 
          className="timeline-grid" 
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
          }}
        >
          {/* Year headers - each spanning exactly the number of months in that year */}
          {Object.entries(yearGroups).map(([year, yearMonths], yearIndex, yearsArray) => {
            // Calculate column span (how many grid columns this year should occupy)
            const columnSpan = yearMonths.length;
            
            // Find the starting column for this year
            const startIndex = months.findIndex(month => 
              month.getFullYear() === parseInt(year) && 
              month.getMonth() === yearMonths[0].getMonth()
            );

            const isLastYear = yearIndex === yearsArray.length - 1;
            
            return (
              <div
                key={`year-${year}`}
                className="timeline-year"
                style={{
                  gridColumn: `${startIndex + 1} / span ${columnSpan}`,
                  gridRow: 1,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: '#f2f2f2',
                  borderBottom: '1px solid #ddd',
                  borderRight: isLastYear ? 'none' : '1px solid #ddd',
                  padding: '8px 5px',
                  fontSize: 'clamp(10px, 1.1vw, 16px)',
                }}
              >
                {year}
              </div>
            );
          })}
          
          {/* Month headers - each taking exactly one column */}
          {months.map((month, index) => (
            <div
              key={`month-${format(month, 'yyyy-MM')}`}
              className="timeline-month"
              style={{
                gridColumn: index + 1,
                gridRow: 2,
                textAlign: 'center',
                padding: '5px',
                fontSize: 'clamp(8px, 1vw, 14px)',
                borderBottom: '1px solid #ddd',
                borderRight: index < months.length - 1 ? '1px dashed #ccc' : 'none',
              }}
            >
              {format(month, 'MMM')}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSystemConnectionLines = () => {
    const months = getMonthsInRange();
    if (months.length === 0) return null;
    
    // Get all build dates and sort them chronologically
    const systemBuildDatesArray = Object.entries(schedules)
      .map(([buildType, schedule]) => ({
        buildType,
        date: schedule.systemBuildDate
      }))
      .filter(item => item.date) // Remove any undefined dates
      .sort((a, b) => a.date - b.date); // Sort by date
    
    // Create lines between consecutive system build dates
    const lines = [];
    for (let i = 0; i < systemBuildDatesArray.length - 1; i++) {
      const startDate = systemBuildDatesArray[i].date;
      const endDate = systemBuildDatesArray[i + 1].date;
      
      const startPos = calculatePosition(startDate, months);
      const endPos = calculatePosition(endDate, months);
      
      lines.push(
        <div
          key={`system-line-${i}`}
          className="timeline-connection-line"
          style={{
            left: `${startPos}%`,
            width: `${endPos - startPos}%`,
            top: '8px', // Position in the middle of the row
          }}
        />
      );
    }
    
    return lines;
  };

  // Add this function to your App.js file
  const renderModuleConnectionLines = (buildType, schedule) => {
    const months = getMonthsInRange();
    if (!schedule || months.length === 0) return null;
    
    // Define standard event types in chronological order
    const standardEventTypes = [
      { key: 'cadRelease', label: 'CAD Release' },
      { key: 'moduleOK2Tool', label: 'OK2Tool' },
      { key: 'moduleOK2Build', label: 'OK2Build' },
      { key: 'moduleOK2Test', label: 'OK2Test' },
      { key: 'moduleOK2Send', label: 'OK2Send' },
      { key: 'systemMIH', label: 'System MIH' },
      { key: 'systemBuildDate', label: 'Sys Mini' }
    ];
    
    // Collect all standard events that have dates
    const standardEvents = standardEventTypes
      .map(eventType => ({
        key: eventType.key,
        label: eventType.label,
        date: schedule[eventType.key],
        isCustom: false
      }))
      .filter(event => event.date); // Filter out events with no dates
    
    // Get custom events for this build type
    const buildCustomEvents = customEvents
      .filter(event => event.buildType === buildType)
      .map(event => ({
        key: `custom-${event.id}`,
        label: event.name,
        date: event.date,
        isCustom: true
      }));
    
    // Combine standard and custom events, then sort by date
    const allEvents = [...standardEvents, ...buildCustomEvents]
      .sort((a, b) => a.date - b.date);
    
    // Create lines between consecutive events
    const lines = [];
    for (let i = 0; i < allEvents.length - 1; i++) {
      const startEvent = allEvents[i];
      const endEvent = allEvents[i + 1];
      
      const startPos = calculatePosition(startEvent.date, months);
      const endPos = calculatePosition(endEvent.date, months);
      
      // Only create a line if the events are different (in case of duplicate dates)
      if (startPos !== endPos) {
        // Determine line style based on event types
        let lineClassName = "timeline-connection-line";
        
        lines.push(
          <div
            key={`module-line-${buildType}-${i}`}
            className={lineClassName}
            style={{
              left: `${startPos}%`,
              width: `${endPos - startPos}%`,
              top: '8px' // Positioned in the middle of the events
            }}
            title={`${startEvent.label} to ${endEvent.label}`}
          />
        );
      }
    }
    
    return lines;
  };

  // renderGridAlignedHolidays function to position holiday labels 
  const renderGridAlignedHolidays = () => {
    const months = getMonthsInRange();
    if (months.length === 0) return null;
    
    // Combine US and China holidays
    const allHolidays = [
      ...usHolidays.map(h => ({ ...h, country: 'US' })),
      ...chinaHolidays.map(h => ({ ...h, country: 'China' }))
    ].sort((a, b) => parseISO(a.startDate) - parseISO(b.startDate));
    
    // Get start and end dates of the entire timeline
    const timelineStart = months[0];
    const timelineEnd = new Date(months[months.length - 1]);
    timelineEnd.setMonth(timelineEnd.getMonth() + 1, 0); // Last day of the last month
    
    return (
      <div 
        className="holiday-grid"
        style={{
          gridTemplateColumns: `repeat(${months.length}, 1fr)`
        }}
      >
        {allHolidays.map((holiday, index) => {
          const hStartDate = parseISO(holiday.startDate);
          const hEndDate = parseISO(holiday.endDate);
          
          // If holiday is outside our timeline range, skip it
          if (isAfter(hStartDate, timelineEnd) || isBefore(hEndDate, timelineStart)) {
            return null;
          }
          
          // Adjust start/end dates to be within timeline bounds
          const effectiveStartDate = isBefore(hStartDate, timelineStart) ? timelineStart : hStartDate;
          const effectiveEndDate = isAfter(hEndDate, timelineEnd) ? timelineEnd : hEndDate;
          
          // Calculate positions using the same calculatePosition function as events
          const startPos = calculatePosition(effectiveStartDate, months);
          const endPos = calculatePosition(effectiveEndDate, months);
          const width = endPos - startPos;
          
          // To find absolute middle, calculate the midpoint date and get its position
          const midpointDays = differenceInDays(effectiveEndDate, effectiveStartDate) / 2;
          const midpointDate = addDays(effectiveStartDate, midpointDays);
          
          const countryClass = holiday.country === 'US' ? 'holiday-segment-us' : 'holiday-segment-china';
          
          return (
            <div
              key={`holiday-segment-${holiday.name}-${index}`}
              className={`holiday-segment ${countryClass}`}
              style={{
                left: `${startPos}%`,
                width: `${width}%`,
                minWidth: '3px',
                position: 'absolute',
                top: 0,
                bottom: 0,
                zIndex: 1,
                pointerEvents: 'auto'
              }}
              title={`${holiday.name} (${holiday.country}): ${format(parseISO(holiday.startDate), 'MMM dd')} - ${format(parseISO(holiday.endDate), 'MMM dd')}`}
            >
              {/* Always show the label, regardless of width */}
              <div 
                className="holiday-segment-label"
                style={{
                  position: 'absolute',
                  top: '1px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  textAlign: 'center',
                  width: 'auto',
                  minWidth: 'fit-content',
                  whiteSpace: 'nowrap',
                  fontSize: '8px',
                  color: '#666',
                  pointerEvents: 'none', // Ensures the label doesn't interfere with hover events
                  zIndex: 2, // Places label above the holiday segment
                  overflow: 'visible'
                }}
              >
                <div className="holiday-name" style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {holiday.name}
                </div>
                <div className="holiday-dates" style={{ fontSize: '8px' }}>
                  {format(parseISO(holiday.startDate), 'M/d')} - {format(parseISO(holiday.endDate), 'M/d')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  

// -------------------- USE EFFECT HOOK ------------------- //


  useEffect(() => {
    try {
      const newSchedules = {};
      
      // For each build type
      buildTypes.forEach(buildType => {
        if (!buildType.date) return;
        
        try {
          const buildDate = parseISO(buildType.date);
          
          // Check if buildDate is valid before proceeding
          if (isNaN(buildDate.getTime())) {
            console.warn(`Invalid date for ${buildType.id}, skipping`);
            return;
          }
          
          // Calculate dates based on lead times
          const systemMIH = subtractBusinessDays(buildDate, leadTimes.systemMIHToSystemBuild);
          const moduleOK2Send = subtractBusinessDays(systemMIH, leadTimes.ok2SendToSystemMIH);
          const moduleOK2Test = subtractBusinessDays(moduleOK2Send, leadTimes.ok2TestToOk2Send);
          const moduleOK2Build = subtractBusinessDays(moduleOK2Test, leadTimes.ok2BuildToOk2Test);
          const moduleOK2Tool = subtractBusinessDays(moduleOK2Build, leadTimes.ok2ToolToOk2Build);
          const cadRelease = subtractBusinessDays(moduleOK2Tool, leadTimes.cadReleaseToOk2Tool);
          const sysMini = buildDate;
          
          newSchedules[buildType.id] = {
            systemBuildDate: buildDate,
            systemMIH,
            moduleOK2Send,
            moduleOK2Test,
            moduleOK2Build,
            moduleOK2Tool,
            cadRelease,
            sysMini
          };
        } catch (error) {
          console.error(`Error calculating dates for ${buildType.name}:`, error);
          // Skip this build type but continue with others
        }
      });
      
      setSchedules(newSchedules);
    } catch (error) {
      console.error('Error in schedule calculation effect:', error);
      // Don't update schedules if there's an error
    }
  }, [buildTypes, usHolidays, chinaHolidays, leadTimes]);


// -------------------- CHILD COMPONENT ------------------- //



  const SystemBuilds = ({ buildTypes, setBuildTypes }) => {
    const [newBuild, setNewBuild] = useState({
      name: '',
      date: '' 
    });
  
    // Add local state for editing existing build dates
    const [editingDates, setEditingDates] = useState({});
  
    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewBuild(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    // Handle input changes for existing build dates
    const handleDateInputChange = (buildId, value) => {
      // Store the change in local state only, not in the main app state
      setEditingDates(prev => ({
        ...prev,
        [buildId]: value
      }));
    };
  
    // Safely sort build types by date
    const safelySortBuildTypes = (builds) => {
      try {
        return [...builds].sort((a, b) => {
          // Handle empty dates (sort them to the end)
          if (!a.date) return 1;
          if (!b.date) return -1;
          
          // Safely parse dates
          try {
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            
            // Make sure both dates are valid
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            
            // Compare dates
            return dateA - dateB;
          } catch (error) {
            console.warn("Date parsing error during sort:", error);
            return 0; // Keep original order if parsing fails
          }
        });
      } catch (error) {
        console.error("Error sorting build types:", error);
        // Return unsorted array if sorting fails
        return builds;
      }
    };
  
    // Only update the main app state when the input loses focus - avoids crashing
    const handleDateBlur = (buildId) => {
      const newDate = editingDates[buildId];
      if (newDate !== undefined) { // Only process if the date was actually edited
        try {
          // Validate the date before updating the main state
          const dateObj = parseISO(newDate);
          if (!isNaN(dateObj.getTime())) {
            // Date is valid, update the app state with sorting
            setBuildTypes(prev => {
              // First update the specific build with new date
              const updatedBuilds = prev.map(build => 
                build.id === buildId 
                  ? { ...build, date: newDate } 
                  : build
              );
              
              // Then sort the builds by date
              return safelySortBuildTypes(updatedBuilds);
            });
          } else {
            console.warn(`Invalid date format for ${buildId}, reverting to previous value`);
            // Revert to the original date in the editing state
            setEditingDates(prev => ({
              ...prev,
              [buildId]: buildTypes.find(b => b.id === buildId)?.date || ''
            }));
          }
        } catch (error) {
          console.error('Error validating date:', error);
          // Reset to previous value
          setEditingDates(prev => ({
            ...prev,
            [buildId]: buildTypes.find(b => b.id === buildId)?.date || ''
          }));
        }
      }
    };
  
    const addBuild = () => {
      if (!newBuild.name || !newBuild.date) {
        alert("Please enter both name and date");
        return;
      }
      
      try {
        // Validate the date first
        const dateObj = parseISO(newBuild.date);
        if (isNaN(dateObj.getTime())) {
          alert("Please enter a valid date");
          return;
        }
        
        // Use the name as the ID directly
        const buildName = newBuild.name.trim();
        
        // Check if build with same name already exists
        const existingBuildIndex = buildTypes.findIndex(build => 
          build.name.toLowerCase() === buildName.toLowerCase()
        );
  
        if (existingBuildIndex >= 0) {
          // Update existing build
          setBuildTypes(prev => {
            const updatedBuilds = prev.map((build, index) => 
              index === existingBuildIndex 
                ? { ...build, date: newBuild.date } 
                : build
            );
            
            // Sort the builds
            return safelySortBuildTypes(updatedBuilds);
          });
        } else {
          // Create new build object using name as the ID
          const newBuildObj = {
            id: buildName, 
            name: buildName, 
            date: newBuild.date,
            order: buildTypes.length + 1
          };
          
          // Add the new build and sort
          setBuildTypes(prev => {
            const updatedBuilds = [...prev, newBuildObj];
            return safelySortBuildTypes(updatedBuilds);
          });
        }
  
        // Reset form
        setNewBuild({
          name: '',
          date: ''
        });
      } catch (error) {
        console.error('Error adding build:', error);
        alert('There was an error adding the build. Please try again.');
      }
    };
  
    const removeBuild = (buildId) => {
      try {
        setBuildTypes(prev => prev.filter(build => build.id !== buildId));
        
        // Remove any schedules and custom events for this build type
        if (typeof setSchedules === 'function') {
          setSchedules(prev => {
            const newSchedules = {...prev};
            delete newSchedules[buildId];
            return newSchedules;
          });
        }
        
        if (typeof setCustomEvents === 'function') {
          setCustomEvents(prev => 
            prev.filter(event => event.buildType !== buildId)
          );
        }
        
        // Clean up editing state as well
        setEditingDates(prev => {
          const newState = {...prev};
          delete newState[buildId];
          return newState;
        });
      } catch (error) {
        console.error('Error removing build:', error);
      }
    };
  
    // Initialize editing state when buildTypes change
    useEffect(() => {
      const newEditingState = {};
      buildTypes.forEach(build => {
        if (!(build.id in editingDates)) {
          newEditingState[build.id] = build.date || '';
        }
      });
      
      if (Object.keys(newEditingState).length > 0) {
        setEditingDates(prev => ({
          ...prev,
          ...newEditingState
        }));
      }
    }, [buildTypes]);
  
    return (
      <div className="system-builds-container">
        {/* Input form */}
        <div className="add-build-type">
          <div className="build-type-form">
            <div className="build-type-input-group">
              <label htmlFor="new-build-name">Build Name:</label>
              <input
                id="new-build-name"
                type="text"
                name="name"
                value={newBuild.name}
                onChange={handleInputChange}
                placeholder="Enter build name"
              />
            </div>
            
            <div className="build-type-input-group">
              <label htmlFor="new-build-date">Date:</label>
              <input
                id="new-build-date"
                type="date"
                name="date"
                value={newBuild.date}
                onChange={handleInputChange}
              />
            </div>
          </div>
  
          <button 
            onClick={addBuild}
            disabled={!newBuild.name || !newBuild.date}
          >
            Add Build
          </button>
        </div>
        
        {/* Build dates table */}
        <div className="build-dates-grid">
          {buildTypes.map(build => (
            <div key={build.id} className="build-date-input">
              <label htmlFor={`${build.id}-date`}>{build.name}:</label>
              <div className="build-date-controls">
                <input
                  id={`${build.id}-date`}
                  type="date"
                  value={editingDates[build.id] !== undefined ? editingDates[build.id] : build.date || ''}
                  onChange={(e) => handleDateInputChange(build.id, e.target.value)}
                  onBlur={() => handleDateBlur(build.id)}
                />
                <button 
                  className="remove-build-btn"
                  onClick={() => removeBuild(build.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  // Completely revised Holiday Section component using the SystemBuilds pattern
  const HolidaySection = ({ 
    usHolidays, setUsHolidays, 
    chinaHolidays, setChinaHolidays
  }) => {
    // Keep form state local to the component
    const [usHolidayForm, setUsHolidayForm] = useState({ 
      name: '', 
      startDate: '', 
      endDate: '' 
    });
    
    const [chinaHolidayForm, setChinaHolidayForm] = useState({ 
      name: '', 
      startDate: '', 
      endDate: '' 
    });
    
    // Handler for US holiday input changes
    const handleUsHolidayChange = (e) => {
      const { name, value } = e.target;
      setUsHolidayForm(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    // Handler for China holiday input changes  
    const handleChinaHolidayChange = (e) => {
      const { name, value } = e.target;
      setChinaHolidayForm(prev => ({
        ...prev,
        [name]: value
      }));
    };

    // Add a new US holiday
    const addUsHoliday = () => {
      if (usHolidayForm.name && usHolidayForm.startDate && usHolidayForm.endDate) {
        try {
          const startDate = parseISO(usHolidayForm.startDate);
          const endDate = parseISO(usHolidayForm.endDate);
          
          // Make sure end date is not before start date
          if (isBefore(endDate, startDate)) {
            alert("End date cannot be before start date");
            return;
          }
          
          // Create a brand new holiday object
          const newHoliday = {
            name: usHolidayForm.name,
            startDate: usHolidayForm.startDate,
            endDate: usHolidayForm.endDate
          };
          
          // Add the holiday
          setUsHolidays(prev => {
            const updatedHolidays = [...prev, newHoliday].sort((a, b) =>
              parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
            );
            return updatedHolidays;
          });
          
          // Reset the form
          setUsHolidayForm({ 
            name: '', 
            startDate: '', 
            endDate: '' 
          });
        } catch (error) {
          console.error("Error adding US holiday:", error);
        }
      }
    };
    
    // Add a new China holiday
    const addChinaHoliday = () => {
      if (chinaHolidayForm.name && chinaHolidayForm.startDate && chinaHolidayForm.endDate) {
        try {
          const startDate = parseISO(chinaHolidayForm.startDate);
          const endDate = parseISO(chinaHolidayForm.endDate);
          
          // Make sure end date is not before start date
          if (isBefore(endDate, startDate)) {
            alert("End date cannot be before start date");
            return;
          }
          
          // Create a brand new holiday object
          const newHoliday = {
            name: chinaHolidayForm.name,
            startDate: chinaHolidayForm.startDate,
            endDate: chinaHolidayForm.endDate
          };
          
          // Add the holiday
          setChinaHolidays(prev => {
            const updatedHolidays = [...prev, newHoliday].sort((a, b) =>
              parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
            );
            return updatedHolidays;
          });
          
          // Reset the form
          setChinaHolidayForm({ 
            name: '', 
            startDate: '', 
            endDate: '' 
          });
        } catch (error) {
          console.error("Error adding China holiday:", error);
        }
      }
    };

    // Remove a holiday
    const removeUsHoliday = (index) => {
      setUsHolidays(prev => prev.filter((_, i) => i !== index));
    };
    
    const removeChinaHoliday = (index) => {
      setChinaHolidays(prev => prev.filter((_, i) => i !== index));
    };

    return (
      <div className="holidays-section-container">
        <h2>Holidays</h2>
        <div className="holidays-section">
          {/* US Holidays Column */}
          <div className="holiday-column">
            <h3>US Holidays</h3>
            <div className="add-holiday">
              <div className="holiday-input-group">
                <label htmlFor="us-holiday-name">Holiday Name:</label>
                <input
                  id="us-holiday-name"
                  type="text"
                  name="name"
                  value={usHolidayForm.name}
                  onChange={handleUsHolidayChange}
                  placeholder="Enter holiday name"
                />
              </div>
              <div className="holiday-input-group">
                <label htmlFor="us-holiday-start-date">Start Date:</label>
                <input
                  id="us-holiday-start-date"
                  type="date"
                  name="startDate"
                  value={usHolidayForm.startDate}
                  onChange={handleUsHolidayChange}
                />
              </div>
              <div className="holiday-input-group">
                <label htmlFor="us-holiday-end-date">End Date:</label>
                <input
                  id="us-holiday-end-date"
                  type="date"
                  name="endDate"
                  value={usHolidayForm.endDate}
                  min={usHolidayForm.startDate}
                  onChange={handleUsHolidayChange}
                />
              </div>
              <button 
                onClick={addUsHoliday}
                disabled={!usHolidayForm.name || !usHolidayForm.startDate || !usHolidayForm.endDate}
              >
                Add Holiday
              </button>
            </div>
            <ul className="holiday-list">
              {usHolidays.map((holiday, index) => (
                <li key={`us-${index}`}>
                  <div className="holiday-info">
                    <span className="holiday-name">{holiday.name}</span>
                    <span className="holiday-date">
                      {format(parseISO(holiday.startDate), 'MMM dd, yyyy')} - {format(parseISO(holiday.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <button onClick={() => removeUsHoliday(index)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* China Holidays Column */}
          <div className="holiday-column">
            <h3>China Holidays</h3>
            <div className="add-holiday">
              <div className="holiday-input-group">
                <label htmlFor="china-holiday-name">Holiday Name:</label>
                <input
                  id="china-holiday-name"
                  type="text"
                  name="name"
                  value={chinaHolidayForm.name}
                  onChange={handleChinaHolidayChange}
                  placeholder="Enter holiday name"
                />
              </div>
              <div className="holiday-input-group">
                <label htmlFor="china-holiday-start-date">Start Date:</label>
                <input
                  id="china-holiday-start-date"
                  type="date"
                  name="startDate"
                  value={chinaHolidayForm.startDate}
                  onChange={handleChinaHolidayChange}
                />
              </div>
              <div className="holiday-input-group">
                <label htmlFor="china-holiday-end-date">End Date:</label>
                <input
                  id="china-holiday-end-date"
                  type="date"
                  name="endDate"
                  value={chinaHolidayForm.endDate}
                  min={chinaHolidayForm.startDate}
                  onChange={handleChinaHolidayChange}
                />
              </div>
              <button 
                onClick={addChinaHoliday}
                disabled={!chinaHolidayForm.name || !chinaHolidayForm.startDate || !chinaHolidayForm.endDate}
              >
                Add Holiday
              </button>
            </div>
            <ul className="holiday-list">
              {chinaHolidays.map((holiday, index) => (
                <li key={`china-${index}`}>
                  <div className="holiday-info">
                    <span className="holiday-name">{holiday.name}</span>
                    <span className="holiday-date">
                      {format(parseISO(holiday.startDate), 'MMM dd, yyyy')} - {format(parseISO(holiday.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <button onClick={() => removeChinaHoliday(index)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Lead Time Settings Component
  const LeadTimeSettings = ({ leadTimes, setLeadTimes }) => {
    // Create local input state to handle immediate typing
    const [inputValues, setInputValues] = useState({
      systemMIHToSystemBuild: leadTimes.systemMIHToSystemBuild.toString(),
      ok2SendToSystemMIH: leadTimes.ok2SendToSystemMIH.toString(),
      ok2TestToOk2Send: leadTimes.ok2TestToOk2Send.toString(),
      ok2BuildToOk2Test: leadTimes.ok2BuildToOk2Test.toString(),
      ok2ToolToOk2Build: leadTimes.ok2ToolToOk2Build.toString(),
      cadReleaseToOk2Tool: leadTimes.cadReleaseToOk2Tool.toString()
    });

    // Initialize input values from props on first render and when props change
    useEffect(() => {
      setInputValues({
        systemMIHToSystemBuild: leadTimes.systemMIHToSystemBuild.toString(),
        ok2SendToSystemMIH: leadTimes.ok2SendToSystemMIH.toString(),
        ok2TestToOk2Send: leadTimes.ok2TestToOk2Send.toString(),
        ok2BuildToOk2Test: leadTimes.ok2BuildToOk2Test.toString(),
        ok2ToolToOk2Build: leadTimes.ok2ToolToOk2Build.toString(),
        cadReleaseToOk2Tool: leadTimes.cadReleaseToOk2Tool.toString()
      });
    }, [leadTimes]);

    // Update local input state immediately when typing
    const handleInputChange = (key, value) => {
      setInputValues(prev => ({
        ...prev,
        [key]: value
      }));
    };

    // Update parent state when input is completed (on blur)
    const handleInputBlur = (key, value) => {
      const numValue = parseInt(value, 10);
      // Ensure we have a valid number (default to 1 if invalid)
      const validValue = isNaN(numValue) || numValue < 1 ? 1 : numValue;
      
      setLeadTimes(prev => ({
        ...prev,
        [key]: validValue
      }));
      
      // Update the local input value to match what was set (for validation feedback)
      setInputValues(prev => ({
        ...prev,
        [key]: validValue.toString()
      }));
    };

    return (
      <div className="lead-time-section-container">
        <h2>Lead Time Settings</h2>
        <p className="lead-time-units">All lead times are specified in days</p>
        <div className="lead-time-settings">
          <div className="lead-time-grid">
            <div className="lead-time-input">
              <label htmlFor="systemMIHToSystemBuild">System MIH to System Build:</label>
              <input 
                id="systemMIHToSystemBuild"
                type="number" 
                min="1"
                value={inputValues.systemMIHToSystemBuild}
                onChange={(e) => handleInputChange('systemMIHToSystemBuild', e.target.value)}
                onBlur={(e) => handleInputBlur('systemMIHToSystemBuild', e.target.value)}
              />
            </div>
            <div className="lead-time-input">
              <label htmlFor="ok2SendToSystemMIH">OK2Send to System MIH:</label>
              <input 
                id="ok2SendToSystemMIH"
                type="number" 
                min="1"
                value={inputValues.ok2SendToSystemMIH}
                onChange={(e) => handleInputChange('ok2SendToSystemMIH', e.target.value)}
                onBlur={(e) => handleInputBlur('ok2SendToSystemMIH', e.target.value)}
              />
            </div>
            <div className="lead-time-input">
              <label htmlFor="ok2TestToOk2Send">OK2Test to OK2Send:</label>
              <input 
                id="ok2TestToOk2Send"
                type="number" 
                min="1"
                value={inputValues.ok2TestToOk2Send}
                onChange={(e) => handleInputChange('ok2TestToOk2Send', e.target.value)}
                onBlur={(e) => handleInputBlur('ok2TestToOk2Send', e.target.value)}
              />
            </div>
            <div className="lead-time-input">
              <label htmlFor="ok2BuildToOk2Test">OK2Build to OK2Test:</label>
              <input 
                id="ok2BuildToOk2Test"
                type="number" 
                min="1"
                value={inputValues.ok2BuildToOk2Test}
                onChange={(e) => handleInputChange('ok2BuildToOk2Test', e.target.value)}
                onBlur={(e) => handleInputBlur('ok2BuildToOk2Test', e.target.value)}
              />
            </div>
            <div className="lead-time-input">
              <label htmlFor="ok2ToolToOk2Build">OK2Tool to OK2Build:</label>
              <input 
                id="ok2ToolToOk2Build"
                type="number" 
                min="1"
                value={inputValues.ok2ToolToOk2Build}
                onChange={(e) => handleInputChange('ok2ToolToOk2Build', e.target.value)}
                onBlur={(e) => handleInputBlur('ok2ToolToOk2Build', e.target.value)}
              />
            </div>
            <div className="lead-time-input">
              <label htmlFor="cadReleaseToOk2Tool">CAD Release to OK2Tool:</label>
              <input 
                id="cadReleaseToOk2Tool"
                type="number" 
                min="1"
                value={inputValues.cadReleaseToOk2Tool}
                onChange={(e) => handleInputChange('cadReleaseToOk2Tool', e.target.value)}
                onBlur={(e) => handleInputBlur('cadReleaseToOk2Tool', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="app-container">
      <h1>Module Schedule Generator</h1>
      
      <div className="input-section">
        <h2>System Build Dates</h2>

        <SystemBuilds 
          buildTypes={buildTypes} 
          setBuildTypes={setBuildTypes} 
        />
      </div>
        
      <LeadTimeSettings 
        leadTimes={leadTimes} 
        setLeadTimes={setLeadTimes} 
      />

      <HolidaySection 
        usHolidays={usHolidays} 
        setUsHolidays={setUsHolidays}
        chinaHolidays={chinaHolidays} 
        setChinaHolidays={setChinaHolidays}
      />

      {/* Custom Events Section */}
      <div className="custom-events-section">
        <h2>Custom Events</h2>
        <div className="add-custom-event">
          <div className="custom-event-inputs">
            <div className="custom-event-input-group">
              <label htmlFor="custom-event-name">Event Name:</label>
              <input
                id="custom-event-name"
                type="text"
                value={newCustomEvent.name}
                onChange={(e) => handleCustomEventChange('name', e.target.value)}
                placeholder="Enter event name"
              />
            </div>
            <div className="custom-event-input-group">
              <label htmlFor="custom-event-date">Date:</label>
              <input
                id="custom-event-date"
                type="date"
                value={newCustomEvent.date}
                onChange={(e) => handleCustomEventChange('date', e.target.value)}
              />
            </div>
            <div className="custom-event-input-group">
              <label htmlFor="custom-event-build">Related Build:</label>
              <select
                id="custom-event-build"
                value={newCustomEvent.buildType}
                onChange={(e) => handleCustomEventChange('buildType', e.target.value)}
              >
                {buildTypes.map(buildType => (
                  <option key={buildType.id} value={buildType.id}>{buildType.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={addCustomEvent}
            disabled={!newCustomEvent.name || !newCustomEvent.date}
          >
            Add Event
          </button>
        </div>
        
        {customEvents.length > 0 && (
          <div className="custom-events-list-container">
            <ul className="custom-events-list">
              {customEvents.map(event => (
                <li key={event.id}>
                  <div className="custom-event-info">
                    <span className="custom-event-name-list">{event.name}</span>
                    <span className="custom-event-detail">
                      {formatDate(event.date)} · {event.buildType}
                    </span>
                  </div>
                  <button onClick={() => removeCustomEvent(event.id)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="output-section">
        <h2>Generated Schedules</h2>  

        {/* Timeline visualization */}
        {Object.keys(schedules).length > 0 && (
          <div className="timeline-container">

            {renderTimelineHeader()}
      
      
            <div className="timeline-content">
              {renderGridAlignedHolidays()}

              {/* System build dates on timeline */}
              <div className="timeline-system-builds">
                <div className="timeline-label">System:</div>
                <div className="timeline-row">
                  {renderSystemConnectionLines()}

                  {Object.entries(schedules).map(([buildType, schedule]) => (
                    <div 
                      key={buildType}
                      className={`timeline-event system-build ${isHolidayDate(schedule.systemBuildDate) ? 'holiday-event' : ''}`}
                      style={{
                        left: `${calculatePosition(schedule.systemBuildDate, getMonthsInRange())}%`
                      }}
                      title={`${buildType}: ${formatDateForTimeline(schedule.systemBuildDate)}${
                        isHolidayDate(schedule.systemBuildDate) 
                          ? ` (Holiday: ${getHolidayName(schedule.systemBuildDate)})` 
                          : ''
                      }`}
                      data-label={buildType}
                      data-date={formatDateForTimeline(schedule.systemBuildDate)}
                    >
                    </div>
                  ))}
                </div>
              </div>


              {/* Module schedules on timeline */}
              {Object.entries(schedules).map(([buildType, schedule]) => (
                
                <div key={buildType} className="timeline-module" data-build={buildType}>
                  <div className="timeline-label">{buildType}:</div>
                  <div className="timeline-row">
                    
                    {renderModuleConnectionLines(buildType, schedule)}

                    <div 
                      className={`timeline-event cad-release ${isHolidayDate(schedule.cadRelease) ? 'holiday-event' : ''}`}
                      style={{
                        left: `${calculatePosition(schedule.cadRelease, getMonthsInRange())}%`
                      }}
                      title={`CAD Release: ${formatDateForTimeline(schedule.cadRelease)}${
                        isHolidayDate(schedule.cadRelease) 
                          ? ` (Holiday: ${getHolidayName(schedule.cadRelease)})` 
                          : ''
                      }`}
                      data-label="MCO"
                      data-date={formatDateForTimeline(schedule.cadRelease)}
                    >
                    </div>
                    <div 
                      className={`timeline-event ok2tool ${isHolidayDate(schedule.moduleOK2Tool) ? 'holiday-event' : ''}`}
                      style={{
                        left: `${calculatePosition(schedule.moduleOK2Tool, getMonthsInRange())}%`
                      }}
                      title={`OK2Tool: ${formatDateForTimeline(schedule.moduleOK2Tool)}${
                        isHolidayDate(schedule.moduleOK2Tool) 
                          ? ` (Holiday: ${getHolidayName(schedule.moduleOK2Tool)})` 
                          : ''
                      }`}
                      data-label="OK2Tool"
                      data-date={formatDateForTimeline(schedule.moduleOK2Tool)}
                    >
                    </div>
                    <div 
                      className={`timeline-event ok2build ${isHolidayDate(schedule.moduleOK2Build) ? 'holiday-event' : ''}`}
                      style={{
                        left: `${calculatePosition(schedule.moduleOK2Build, getMonthsInRange())}%`
                      }}
                      title={`OK2Build: ${formatDateForTimeline(schedule.moduleOK2Build)}${
                        isHolidayDate(schedule.moduleOK2Build) 
                          ? ` (Holiday: ${getHolidayName(schedule.moduleOK2Build)})` 
                          : ''
                      }`}
                      data-label="OK2B"
                      data-date={formatDateForTimeline(schedule.moduleOK2Build)}
                    >
                    </div>
                    <div 
                      className={`timeline-event system-mih ${isHolidayDate(schedule.systemMIH) ? 'holiday-event' : ''}`}
                      style={{
                        left: `${calculatePosition(schedule.systemMIH, getMonthsInRange())}%`
                      }}
                      title={`System MIH: ${formatDateForTimeline(schedule.systemMIH)}${
                        isHolidayDate(schedule.systemMIH) 
                          ? ` (Holiday: ${getHolidayName(schedule.systemMIH)})` 
                          : ''
                      }`}
                      data-label="MIH"
                      data-date={formatDateForTimeline(schedule.systemMIH)}
                    >
                    </div>
                    {/* Add Sys Mini event to each module row */}
                    <div 
                      className={`timeline-event sys-mini ${isHolidayDate(schedule.systemBuildDate) ? 'holiday-event' : ''}`}
                      style={{
                        left: `${calculatePosition(schedule.systemBuildDate, getMonthsInRange())}%`
                      }}
                      title={`Sys Mini: ${formatDateForTimeline(schedule.systemBuildDate)}${
                        isHolidayDate(schedule.systemBuildDate) 
                          ? ` (Holiday: ${getHolidayName(schedule.systemBuildDate)})` 
                          : ''
                      }`}
                      data-label="Sys Mini"
                      data-date={formatDateForTimeline(schedule.systemBuildDate)}
                    >
                    </div>
                    
                    {/* Custom events for this build type */}
                    {customEvents.filter(event => event.buildType === buildType).length > 0 && 
                      customEvents
                      .filter(event => event.buildType === buildType)
                      .map(event => (
                        <div 
                          key={`custom-event-${event.id}`}
                          className="custom-event-container"
                          style={{
                            left: `${calculatePosition(event.date, getMonthsInRange())}%`
                          }}
                        >
                          <div className="custom-event-name">{event.name}</div>
                          <div className="custom-event-line"></div>
                          <div className="custom-event-diamond"></div>
                          <div className="custom-event-date">{formatDateForTimeline(event.date)}</div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            
          </div>
        )}
        

        {/* Table */}
        <div className="schedules-table-container">
          <table className="schedules-table">
            <thead>
              <tr>
                <th>Build</th>
                <th>CAD Release</th>
                <th>OK2Tool</th>
                <th>OK2Build</th>
                <th>OK2Test</th>
                <th>OK2Send</th>
                <th>System MIH</th>
                <th>System Build</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(schedules).map(([buildType, schedule]) => (
                <tr key={buildType}>
                  <td className="build-type">{buildType}</td>
                  <td>{formatDateForTable(schedule.cadRelease)}</td>
                  <td>{formatDateForTable(schedule.moduleOK2Tool)}</td>
                  <td>{formatDateForTable(schedule.moduleOK2Build)}</td>
                  <td>{formatDateForTable(schedule.moduleOK2Test)}</td>
                  <td>{formatDateForTable(schedule.moduleOK2Send)}</td>
                  <td>{formatDateForTable(schedule.systemMIH)}</td>
                  <td>{formatDateForTable(schedule.systemBuildDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {Object.keys(schedules).length > 0 && (
          <button 
            className="download-btn" 
            onClick={downloadScheduleImage} 
            disabled={Object.keys(schedules).length === 0}
          >
            Download Schedule Image
          </button>
        )} 
      </div>
    </div>
  );
}

export default App;
