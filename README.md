# Little Moments

Mobile-first classroom photo journal and multi-year student portfolio app.

## Current foundation build
- Mobile PWA shell
- Approved Little Moments cover direction
- Home/Journal screen
- IndexedDB persistent data foundation
- Permanent student profiles
- Separate school years and enrollments
- Shared moment/photo storage structure
- Portfolio-book and settings stores
- Offline-capable service worker foundation

## Core data hierarchy
Student -> School Year Enrollment -> Moments

A saved Moment stores child IDs rather than duplicating the photo for each child.

## Next build section
Class & Student Management, followed by Capture a Moment.
