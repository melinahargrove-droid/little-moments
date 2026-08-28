# Little Moments

Mobile-first classroom photo journal and multi-year student portfolio app.

## Current build
- Mobile PWA shell
- Little Moments cover and Home/Journal screen
- IndexedDB persistent data foundation
- Permanent student profiles
- Separate school years and enrollments
- Current Class / Past Students management
- Duplicate-profile protection for returning students
- Capture a Moment photo workflow
- Required caption and student tagging
- Optional learning tags and Portfolio Favorite
- Original photo storage plus shared Moment records
- Recently tagged student shortcuts
- Capture Another / Keep these friends flow
- Offline-capable service worker foundation
- GitHub Pages deployment workflow for phone testing

## Core data hierarchy
Student -> School Year Enrollment -> Moments

A saved Moment stores child IDs rather than duplicating the photo for each child.

## Current testing phase
Refine and lock the first complete loop before building Our Moments and Moment Detail.
