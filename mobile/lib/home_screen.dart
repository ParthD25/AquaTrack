import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:async';
import 'package:url_launcher/url_launcher.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _hasAgreed = false;
  bool _isLoadingAgreement = true;
  String _role = 'lifeguard';
  StreamSubscription<DocumentSnapshot>? _userSub;

  List<_NavItem> _buildNavItems() {
    final items = <_NavItem>[
      _NavItem(
        label: 'Home',
        icon: Icons.dashboard_rounded,
        page: const _DashboardTab(),
        roles: const ['admin', 'sr_guard', 'pool_tech', 'lifeguard'],
      ),
      _NavItem(
        label: 'Tasks',
        icon: Icons.check_circle_outline,
        page: const _TasksTab(),
        roles: const ['admin', 'sr_guard', 'pool_tech', 'lifeguard'],
      ),
      _NavItem(
        label: 'Audits',
        icon: Icons.verified_user_outlined,
        page: const _AuditsTab(),
        roles: const ['admin', 'sr_guard'],
      ),
      _NavItem(
        label: 'Docs',
        icon: Icons.folder_outlined,
        page: _DocsTab(role: _role),
        roles: const ['admin', 'sr_guard', 'pool_tech', 'lifeguard'],
      ),
      _NavItem(
        label: 'Inventory',
        icon: Icons.inventory_2_outlined,
        page: _InventoryTab(role: _role),
        roles: const ['admin', 'sr_guard', 'pool_tech'],
      ),
      _NavItem(
        label: 'Admin',
        icon: Icons.admin_panel_settings_outlined,
        page: const _AdminTab(),
        roles: const ['admin'],
      ),
    ];
    return items.where((item) => item.roles.contains(_role)).toList();
  }

  @override
  void initState() {
    super.initState();
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      _userSub = FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .snapshots()
          .listen((docSnap) {
            if (docSnap.exists) {
              final data = docSnap.data() as Map<String, dynamic>;
              setState(() {
                _hasAgreed = data['hasAgreedToTerms'] == true;
                _isLoadingAgreement = false;
                _role = (data['role'] ?? data['positionId'] ?? 'lifeguard') as String;
              });
            }
          });
    } else {
      setState(() => _isLoadingAgreement = false);
    }
  }

  @override
  void dispose() {
    _userSub?.cancel();
    super.dispose();
  }

  Future<void> _agreeToTerms() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'hasAgreedToTerms': true,
      }, SetOptions(merge: true));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingAgreement) {
      return const Scaffold(
        backgroundColor: Color(0xFF0A1530),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF2DD4BF)),
        ),
      );
    }

    if (!_hasAgreed) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A1530),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF132040),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.red.withValues(alpha: 77)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.redAccent,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'CONFIDENTIALITY & DUTY TO ACT',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const SizedBox(
                      height: 260,
                      child: SingleChildScrollView(
                        child: SelectableText(
                          'AMERICAN RED CROSS STANDARD OF CARE:\nBy accessing this system, you acknowledge and agree to uphold the American Red Cross standard of care for professional lifeguards. You recognize your legal Duty to Act while on active duty at the Silliman Activity and Family Aquatic Center (City of Newark: https://www.newark.org/departments/recreation-and-community-services/silliman-activity-and-family-aquatic-center).\n\nSTRICT CONFIDENTIALITY:\nThis application, including all medical Incident Reports, Rescue documentation, Employee certifications, and internal facility operations, contains highly confidential information that is legally privileged. If you are not an active, authorized employee, you are legally notified that any unauthorized disclosure, photography, copying, distribution, or use of any information contained within this system is strictly prohibited by law.',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                            height: 1.6,
                          ),
                          textAlign: TextAlign.justify,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => FirebaseAuth.instance.signOut(),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: Colors.white24),
                            ),
                            child: const Text(
                              'Disagree / Exit',
                              style: TextStyle(color: Colors.white70),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _agreeToTerms,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.redAccent,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text(
                              'I Agree',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _buildNavItems().map((i) => i.page).toList()),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('AquaTrack AI coming soon to mobile!'),
            ),
          );
        },
        backgroundColor: const Color(0xFF2DD4BF),
        child: const Icon(Icons.auto_awesome, color: Color(0xFF0A1530)),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.white.withValues(alpha: 13)),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: const Color(0xFF0A1530),
          selectedItemColor: const Color(0xFF2DD4BF),
          unselectedItemColor: Colors.white54,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: _buildNavItems()
              .map((item) => BottomNavigationBarItem(icon: Icon(item.icon), label: item.label))
              .toList(),
        ),
      ),
    );
  }
}

class _NavItem {
  _NavItem({
    required this.label,
    required this.icon,
    required this.page,
    required this.roles,
  });

  final String label;
  final IconData icon;
  final Widget page;
  final List<String> roles;
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();
  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AquaTrack',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.account_circle_outlined,
              color: Colors.white,
            ),
            onPressed: () {
              // Quick logout for now
              FirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Welcome, ${user?.email?.split('@')[0] ?? 'User'}!',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 24),
          // Quick Actions Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00D4FF), Color(0xFF2DD4BF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Today\'s Shift',
                  style: TextStyle(
                    color: Color(0xFF0A1530),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Morning (5:30 AM - 9:30 AM)',
                  style: TextStyle(
                    color: Color(0xFF0A1530),
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 16),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: Color(0xFF0A1530),
                      size: 20,
                    ),
                    SizedBox(width: 8),
                    Text(
                      '0 of 4 tasks completed',
                      style: TextStyle(
                        color: Color(0xFF0A1530),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TasksTab extends StatelessWidget {
  const _TasksTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Shift Tasks',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
      ),
      body: const Center(
        child: Text(
          'Tasks list will mirror web app',
          style: TextStyle(color: Colors.white54),
        ),
      ),
    );
  }
}

class _AuditsTab extends StatelessWidget {
  const _AuditsTab();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Staff Directory (Live)',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('staff').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFF2DD4BF)),
            );
          }
          if (snapshot.hasError) {
            return Center(
              child: Text(
                'Error: ${snapshot.error}',
                style: const TextStyle(color: Colors.red),
              ),
            );
          }
          final staffDocs = snapshot.data?.docs ?? [];
          if (staffDocs.isEmpty) {
            return const Center(
              child: Text(
                'No staff found in database',
                style: TextStyle(color: Colors.white54),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: staffDocs.length,
            itemBuilder: (context, index) {
              final data = staffDocs[index].data() as Map<String, dynamic>;
              final name = '${data['firstName']} ${data['lastName']}';
              final isGraduating = data['isHighSchool'] == true;
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF132040),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: 13)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(
                        0xFF2DD4BF,
                      ).withValues(alpha: 51),
                      child: Text(
                        name[0],
                        style: const TextStyle(
                          color: Color(0xFF2DD4BF),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Position: ${data['positionId'] ?? 'Unknown'}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isGraduating)
                      const Icon(Icons.school, color: Colors.orange, size: 20),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _DocsTab extends StatefulWidget {
  const _DocsTab({required this.role});
  final String role;

  @override
  State<_DocsTab> createState() => _DocsTabState();
}

class _DocsTabState extends State<_DocsTab> {
  String _activeCategory = 'all';
  int _activeYear = 0;

  bool _canAccessDoc(String accessLevel) {
    const order = ['lifeguard', 'pool_tech', 'sr_guard', 'admin'];
    final docIndex = order.indexOf(accessLevel);
    final userIndex = order.indexOf(widget.role);
    if (docIndex == -1 || userIndex == -1) return false;
    return userIndex >= docIndex;
  }

  @override
  Widget build(BuildContext context) {
    const categories = [
      {'key': 'all', 'label': 'All'},
      {'key': 'staff_forms', 'label': 'Staff Forms'},
      {'key': 'checklists', 'label': 'Checklists'},
      {'key': 'senior_lg', 'label': 'Senior LG'},
      {'key': 'pool_tech', 'label': 'Pool Tech'},
      {'key': 'training', 'label': 'Training'},
      {'key': 'audits', 'label': 'Audits'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Document Library', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF132040),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('documents').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2DD4BF)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }

          final docs = snapshot.data?.docs
              .map((d) => d.data() as Map<String, dynamic>)
              .where((d) {
                final access = (d['accessLevel'] ?? 'lifeguard') as String;
                return _canAccessDoc(access);
              })
              .toList() ?? [];

          final years = docs
              .map((d) => d['year'])
              .where((y) => y is int)
              .cast<int>()
              .toSet()
              .toList()
            ..sort((a, b) => b.compareTo(a));

          final filtered = docs.where((d) {
            final category = d['category'] ?? 'General';
            final year = d['year'] ?? 0;
            if (_activeCategory != 'all' && category != _activeCategory) return false;
            if (_activeYear != 0 && year != _activeYear) return false;
            return true;
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: categories.map((c) {
                    final key = c['key'] as String;
                    final selected = _activeCategory == key;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(c['label'] as String),
                        selected: selected,
                        onSelected: (_) => setState(() => _activeCategory = key),
                        selectedColor: const Color(0xFF2DD4BF),
                        labelStyle: TextStyle(color: selected ? const Color(0xFF0A1530) : Colors.white70),
                        backgroundColor: const Color(0xFF132040),
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 12),
              if (years.isNotEmpty)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ChoiceChip(
                        label: const Text('All Years'),
                        selected: _activeYear == 0,
                        onSelected: (_) => setState(() => _activeYear = 0),
                        selectedColor: const Color(0xFF2DD4BF),
                        labelStyle: TextStyle(color: _activeYear == 0 ? const Color(0xFF0A1530) : Colors.white70),
                        backgroundColor: const Color(0xFF132040),
                      ),
                      const SizedBox(width: 8),
                      ...years.map((y) {
                        final selected = _activeYear == y;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text('$y'),
                            selected: selected,
                            onSelected: (_) => setState(() => _activeYear = y),
                            selectedColor: const Color(0xFF2DD4BF),
                            labelStyle: TextStyle(color: selected ? const Color(0xFF0A1530) : Colors.white70),
                            backgroundColor: const Color(0xFF132040),
                          ),
                        );
                      })
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              ...filtered.map((doc) {
                final title = doc['title'] ?? 'Untitled';
                final category = doc['category'] ?? 'General';
                final url = doc['url'] ?? '';
                final year = doc['year'] ?? '';
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF132040),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withValues(alpha: 13)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Category: $category ${year != '' ? '• $year' : ''}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () async {
                          if (url.isEmpty) return;
                          final uri = Uri.parse(url);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                        },
                        child: const Text('Open Document'),
                      ),
                    ],
                  ),
                );
              }),
              if (filtered.isEmpty)
                const Center(child: Text('No documents found', style: TextStyle(color: Colors.white54))),
            ],
          );
        },
      ),
    );
  }
}

class _InventoryTab extends StatefulWidget {
  const _InventoryTab({required this.role});
  final String role;

  @override
  State<_InventoryTab> createState() => _InventoryTabState();
}

class _InventoryTabState extends State<_InventoryTab> {
  static const _items = [
    {'id': 'emergency_oxygen_first_aid', 'label': 'Emergency Oxygen - First Aid Room', 'unit': 'PSI'},
    {'id': 'emergency_oxygen_office', 'label': 'Emergency Oxygen - Office', 'unit': 'PSI'},
    {'id': 'gloves_xs', 'label': 'Gloves - XS', 'unit': 'boxes'},
    {'id': 'gloves_s', 'label': 'Gloves - S', 'unit': 'boxes'},
    {'id': 'gloves_m', 'label': 'Gloves - M', 'unit': 'boxes'},
    {'id': 'gloves_l', 'label': 'Gloves - L', 'unit': 'boxes'},
    {'id': 'gloves_xl', 'label': 'Gloves - XL', 'unit': 'boxes'},
    {'id': 'bandaids_variety', 'label': 'BandAids - E+R Variety Pack', 'unit': 'boxes'},
    {'id': 'bandaids_strip', 'label': 'BandAids - Medi-First 7/8" x 3" Strip', 'unit': 'boxes'},
    {'id': 'stretch_bandage_1', 'label': 'Stretch Bandages - 1" x 75"', 'unit': 'boxes'},
    {'id': 'stretch_bandage_2', 'label': 'Stretch Bandages - 2" x 75"', 'unit': 'boxes'},
    {'id': 'stretch_bandage_3', 'label': 'Stretch Bandages - 3" x 75"', 'unit': 'boxes'},
    {'id': 'gauze_2x2', 'label': 'Gauze Pads - 2" x 2"', 'unit': 'boxes'},
    {'id': 'gauze_3x3', 'label': 'Gauze Pads - 3" x 3"', 'unit': 'boxes'},
    {'id': 'gauze_4x4', 'label': 'Gauze Pads - 4" x 4" (E+R/Dynarex/Medline)', 'unit': 'boxes'},
    {'id': 'knuckle_bandages', 'label': 'Knuckle Bandages', 'unit': 'boxes'},
    {'id': 'medi_rip_bandage', 'label': 'Medi-Rip Self-Adherent Bandage', 'unit': 'rolls'},
    {'id': 'medical_tape', 'label': 'Medical Tape Rolls', 'unit': 'rolls'},
    {'id': 'razors', 'label': 'Razors', 'unit': 'units'},
    {'id': 'scissors', 'label': 'Scissors', 'unit': 'units'},
    {'id': 'pulse_oximeter', 'label': 'Pulse Oximeter', 'unit': 'units'},
    {'id': 'biohazard_bags', 'label': 'Biohazard Bags', 'unit': 'bags'},
    {'id': 'ice_packs', 'label': 'Ice Packs', 'unit': 'bags'},
    {'id': 'pulsar_cleaner', 'label': 'Pulsar Cleaner', 'unit': 'bottles'},
    {'id': 'co2_tank_1', 'label': 'CO2 Level Tank 1', 'unit': 'level'},
    {'id': 'co2_tank_2', 'label': 'CO2 Level Tank 2', 'unit': 'level'},
    {'id': 'muriatic_acid_tank_1', 'label': 'Muriatic Acid Level Tank 1', 'unit': 'level'},
    {'id': 'muriatic_acid_tank_2', 'label': 'Muriatic Acid Level Tank 2', 'unit': 'level'},
    {'id': 'pulsar_briquettes_100', 'label': 'Pulsar Briquettes - 100 lb', 'unit': 'lbs'},
    {'id': 'pulsar_briquettes_50', 'label': 'Pulsar Briquettes - 50 lb', 'unit': 'lbs'},
    {'id': 'liquid_chlorine', 'label': 'Liquid Chlorine', 'unit': 'gallons'},
    {'id': 'sodium_bicarbonate', 'label': 'Sodium Bicarbonate (50 lb bags)', 'unit': 'bags'},
    {'id': 'calcium', 'label': 'Calcium (50 lb bags)', 'unit': 'bags'},
    {'id': 'dpd1a_reagent', 'label': 'DPD1A Test Reagent', 'unit': 'bottles'},
    {'id': 'dpd1b_reagent', 'label': 'DPD1B Test Reagent', 'unit': 'bottles'},
    {'id': 'dpd3_reagent', 'label': 'DPD3 Test Reagent', 'unit': 'bottles'},
    {'id': 'ph_reagent', 'label': 'pH Test Reagent', 'unit': 'bottles'},
    {'id': 'alk_reagent', 'label': 'ALK Test Reagent', 'unit': 'bottles'},
    {'id': 'ch1_reagent', 'label': 'CH1 Test Reagent', 'unit': 'bottles'},
    {'id': 'ch2_reagent', 'label': 'CH2 Test Reagent', 'unit': 'bottles'},
  ];

  String _month = DateTime.now().toIso8601String().substring(0, 7);
  final Map<String, TextEditingController> _controllers = {};
  final TextEditingController _notesController = TextEditingController();
  bool _saving = false;
  String _status = '';

  List<String> _monthOptions() {
    final now = DateTime.now();
    return List.generate(12, (i) {
      final d = DateTime(now.year, now.month - i, 1);
      return '${d.year}-${d.month.toString().padLeft(2, '0')}';
    });
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _notesController.dispose();
    super.dispose();
  }

  bool get _canAccess => ['admin', 'sr_guard', 'pool_tech'].contains(widget.role);

  Future<void> _loadMonth() async {
    final snap = await FirebaseFirestore.instance.collection('inventory_entries').doc(_month).get();
    if (snap.exists) {
      final data = snap.data() as Map<String, dynamic>;
      final items = (data['items'] as Map<String, dynamic>?) ?? {};
      for (final item in _items) {
        final id = item['id'] as String;
        _controllers[id]?.text = '${items[id] ?? 0}';
      }
      _notesController.text = data['notes'] ?? '';
    } else {
      for (final item in _items) {
        final id = item['id'] as String;
        _controllers[id]?.text = '0';
      }
      _notesController.text = '';
    }
  }

  Future<void> _save() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    setState(() {
      _saving = true;
      _status = '';
    });
    final items = <String, num>{};
    for (final item in _items) {
      final id = item['id'] as String;
      items[id] = num.tryParse(_controllers[id]?.text ?? '0') ?? 0;
    }
    await FirebaseFirestore.instance.collection('inventory_entries').doc(_month).set({
      'month': _month,
      'items': items,
      'notes': _notesController.text.trim(),
      'updatedAt': DateTime.now().toIso8601String(),
      'updatedBy': user.uid,
      'updatedByName': user.displayName ?? user.email ?? 'User',
    }, SetOptions(merge: true));
    setState(() {
      _saving = false;
      _status = 'Saved.';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_canAccess) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Inventory', style: TextStyle(fontWeight: FontWeight.bold)),
          backgroundColor: const Color(0xFF132040),
        ),
        body: const Center(child: Text('Access restricted', style: TextStyle(color: Colors.white54))),
      );
    }

    _controllers.putIfAbsent('init', () {
      for (final item in _items) {
        _controllers[item['id'] as String] = TextEditingController(text: '0');
      }
      _loadMonth();
      return TextEditingController();
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF132040),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _month,
                  items: _monthOptions()
                      .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                      .toList(),
                  onChanged: (value) async {
                    if (value == null) return;
                    setState(() => _month = value);
                    await _loadMonth();
                  },
                  decoration: const InputDecoration(
                    labelText: 'Month',
                    filled: true,
                    fillColor: Color(0xFF132040),
                    border: OutlineInputBorder(borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving...' : 'Save')),
            ],
          ),
          const SizedBox(height: 16),
          ..._items.map((item) {
            final id = item['id'] as String;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF132040),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 13)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['label'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text('Unit: ${item['unit']}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _controllers[id],
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      filled: true,
                      fillColor: Color(0xFF0A1530),
                      border: OutlineInputBorder(borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Notes',
              filled: true,
              fillColor: Color(0xFF132040),
              border: OutlineInputBorder(borderSide: BorderSide.none),
            ),
          ),
          if (_status.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_status, style: const TextStyle(color: Colors.white70)),
            ),
        ],
      ),
    );
  }
}

class _AdminTab extends StatelessWidget {
  const _AdminTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Access', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF132040),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('staff').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2DD4BF)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          }
          final staffDocs = snapshot.data?.docs ?? [];
          if (staffDocs.isEmpty) {
            return const Center(child: Text('No staff records found', style: TextStyle(color: Colors.white54)));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: staffDocs.length,
            itemBuilder: (context, index) {
              final data = staffDocs[index].data() as Map<String, dynamic>;
              final id = staffDocs[index].id;
              final name = '${data['firstName']} ${data['lastName']}';
              final positionId = data['positionId'] ?? 'lifeguard';
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF132040),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withValues(alpha: 13)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: positionId,
                      dropdownColor: const Color(0xFF132040),
                      items: const [
                        DropdownMenuItem(value: 'admin', child: Text('Administrator')),
                        DropdownMenuItem(value: 'sr_guard', child: Text('Senior Guard')),
                        DropdownMenuItem(value: 'pool_tech', child: Text('Pool Tech')),
                        DropdownMenuItem(value: 'lifeguard', child: Text('Lifeguard')),
                      ],
                      onChanged: (value) async {
                        if (value == null) return;
                        await FirebaseFirestore.instance.collection('staff').doc(id).set({
                          'positionId': value,
                        }, SetOptions(merge: true));
                        await FirebaseFirestore.instance.collection('users').doc(id).set({
                          'positionId': value,
                          'role': value,
                        }, SetOptions(merge: true));
                      },
                      decoration: const InputDecoration(
                        labelText: 'Role',
                        filled: true,
                        fillColor: Color(0xFF0A1530),
                        border: OutlineInputBorder(borderSide: BorderSide.none),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Document Library',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF132040),
      ),
      body: const Center(
        child: Text(
          'Role-filtered documents',
          style: TextStyle(color: Colors.white54),
        ),
      ),
    );
  }
}
