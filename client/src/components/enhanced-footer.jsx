"use client"

import { Shield, Eye, Github, Twitter, Linkedin, Activity, Server } from "lucide-react"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700/50 mt-auto relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Brand Section - Compact */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">EagleEye</h3>
                <p className="text-xs text-slate-400">Advanced Security Monitoring</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Advanced CCTV monitoring system with AI-powered detection capabilities.
            </p>
            
            <div className="flex items-center space-x-2 p-2 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-300">System Operational</span>
              <div className="ml-auto flex items-center space-x-1 text-xs text-slate-400">
                <Activity className="w-3 h-3" />
                <span>All systems running</span>
              </div>
            </div>
          </div>

          {/* System Info - Compact */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Server className="w-3 h-3 text-white" />
              </div>
              <h4 className="text-sm font-bold text-white">System Status</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700 text-center">
                <div className="text-xs text-slate-400">Version</div>
                <div className="text-xs text-white font-mono">v2.1.0</div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700 text-center">
                <div className="text-xs text-slate-400">Uptime</div>
                <div className="text-xs text-green-400 font-mono">99.9%</div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700 text-center">
                <div className="text-xs text-slate-400">Updated</div>
                <div className="text-xs text-white font-mono">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Compact */}
      <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            
            {/* Copyright */}
            <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4">
              <p className="text-xs text-slate-400">
                © {currentYear} EagleEye Security Systems. All rights reserved.
              </p>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Shield className="w-3 h-3" />
                <span>Built with security in mind</span>
              </div>
            </div>

            {/* Social Links & Status */}
            <div className="flex items-center space-x-4">
              
              {/* Social Media */}
              <div className="flex items-center space-x-1">
                <a
                  href="#"
                  className="text-slate-400 hover:text-white transition-all duration-200 p-1 hover:bg-slate-700/50 rounded hover:scale-110"
                  title="GitHub"
                >
                  <Github className="w-3 h-3" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-400 transition-all duration-200 p-1 hover:bg-slate-700/50 rounded hover:scale-110"
                  title="Twitter"
                >
                  <Twitter className="w-3 h-3" />
                </a>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-500 transition-all duration-200 p-1 hover:bg-slate-700/50 rounded hover:scale-110"
                  title="LinkedIn"
                >
                  <Linkedin className="w-3 h-3" />
                </a>
              </div>

              {/* Live Status */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-slate-800/80 to-slate-700/80 rounded-full border border-slate-600">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-300">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bottom Border */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-cyan-500"></div>
    </footer>
  )
}

export default Footer
