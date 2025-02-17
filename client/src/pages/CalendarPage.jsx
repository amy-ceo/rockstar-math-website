import React from 'react'
import CalendarBanner from '../components/banners/CalendarBanner'
import Calendar from '../components/Calendar'
import CalenderSection from '../components/CalenderSection'
function CalendarPage() {
    return (
        <>
            <CalendarBanner />
            <div className="my-10">
                <CalenderSection />
            </div>
        </>
    )

}

export default CalendarPage