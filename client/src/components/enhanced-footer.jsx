"use client"

import { Shield, Eye, Mail, FileText, Lock, ExternalLink, Github, Twitter, Linkedin } from "lucide-react"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">EagleEye</h3>
                <p className="text-xs text-slate-400">Security Monitoring</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Advanced CCTV monitoring system providing real-time security surveillance with AI-powered detection
              capabilities.
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">System Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <Lock className="w-3 h-3 group-hover:text-blue-400" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <FileText className="w-3 h-3 group-hover:text-blue-400" />
                  <span>Terms of Service</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <Shield className="w-3 h-3 group-hover:text-blue-400" />
                  <span>Security Policy</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Support</span>
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <Mail className="w-3 h-3 group-hover:text-green-400" />
                  <span>Contact Support</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <FileText className="w-3 h-3 group-hover:text-green-400" />
                  <span>Documentation</span>
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-2 group"
                >
                  <ExternalLink className="w-3 h-3 group-hover:text-green-400" />
                  <span>System Status</span>
                </a>
              </li>
            </ul>
          </div>

          {/* System Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">System Info</h4>
            <div className="space-y-3">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Version</span>
                  <span className="text-xs text-white font-mono">v2.1.0</span>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Uptime</span>
                  <span className="text-xs text-green-400 font-mono">99.9%</span>
                </div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Last Update</span>
                  <span className="text-xs text-white font-mono">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700/50 bg-slate-900/50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-4">
              <p className="text-sm text-slate-400">© {currentYear} EagleEye Security Systems. All rights reserved.</p>
              <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500">
                <span>•</span>
                <span>Built with security in mind</span>
              </div>
            </div>

            {/* Social Links & Status */}
            <div className="flex items-center space-x-6">
              {/* Social Media */}
              <div className="flex items-center space-x-3">
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700/50 rounded"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>

              {/* Live Status */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-300">Live Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
    </footer>
  )
}

export default Footer
