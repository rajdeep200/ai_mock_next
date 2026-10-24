"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow, Chevron } from "./icons";

function planHint(minutes: number) {
  if (minutes <= 15) return "Fits the Free plan.";
  if (minutes <= 30) return "Needs Starter or Pro for sessions over 15 minutes.";
  return "Needs Pro for sessions over 30 minutes.";
}

export default function StartCard() {
  const [minutes, setMinutes] = useState(30);

  return (
    <section className="start" id="start">
      <div className="wrap">
        <div className="start-card">
          <p className="eyebrow">Set up your first question</p>
          <h2>What do you want to practice today?</h2>
          <div className="picker">
            <div className="field">
              <label htmlFor="topic">Topic</label>
              <div className="sel">
                <select id="topic" defaultValue="DSA">
                  <option>DSA</option>
                </select>
                <Chevron />
              </div>
            </div>
            <div className="field">
              <label htmlFor="level">Level</label>
              <div className="sel">
                <select id="level" defaultValue="Medium">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
                <Chevron />
              </div>
            </div>
            <div className="field">
              <label htmlFor="dur">Length</label>
              <div className="sel">
                <select id="dur" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
                <Chevron />
              </div>
            </div>
          </div>
          <p className="note" id="note" aria-live="polite">{planHint(minutes)}</p>
          <Link href="/home" className="btn">
            Start session <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
