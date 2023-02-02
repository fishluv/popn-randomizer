import React from 'react';
import { Chart, Database, parseSranLevel } from 'popn-db-js';
import ControlPanel, { ControlPanelState } from '../components/ControlPanel';
import SetList from '../components/SetList';
import { ChartDisplayOptions, parseChartDisplayStyle } from '../components/ChartDisplay';
import styles from './RandomizerApp.module.scss';
import { getStorageBoolean, getStorageNumber, getStorageString, setStorageItem, setStorageItemIfNull } from '../lib/storage';
import { ChartDrawOptions, deserializeVersionFolders, serializeVersionFolders, ALL_VERSION_FOLDERS } from '../components/ChartDrawOptions';
import { parseIncludeOptionSafe } from '../components/parse';

interface RandomizerAppState {
  isDoneLoading: boolean;
  chartDataSets: Chart[][];
  chartDrawOptions: Partial<ChartDrawOptions>;
  chartDisplayOptions: ChartDisplayOptions;
}

export interface ChartQuerySampleOptions {
  count: number;
  query: string;
}

export default class RandomizerApp extends React.Component<{}, RandomizerAppState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      isDoneLoading: false,
      chartDataSets: [],
      chartDisplayOptions: {
        sranModeEnabled: false,
        preferGenre: false,
        showChartDetails: false,
        displayStyle: "normal",
        assetsUrl: '',
        showLinks: false,
        customLink1Url: '',
      },
      chartDrawOptions: {},
    };
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.handleUnload);

    // Draw options
    setStorageItemIfNull('count', 5);
    setStorageItemIfNull('levelMin', 30);
    setStorageItemIfNull('levelMax', 40);
    setStorageItemIfNull('sranLevelMin', '01a');
    setStorageItemIfNull('sranLevelMax', '05');
    setStorageItemIfNull('includeDiffsRadio', "all");
    setStorageItemIfNull('includeDiffs', "enhx");
    setStorageItemIfNull('versionFoldersRadio', "all");
    setStorageItemIfNull('versionFolders', serializeVersionFolders(ALL_VERSION_FOLDERS));
    setStorageItemIfNull('onlyIncludeHardest', false);
    setStorageItemIfNull('excludeFloorInfection', false);
    setStorageItemIfNull('excludeBuggedBpms', false);
    setStorageItemIfNull("holdNotes", "include");
    setStorageItemIfNull('excludeLivelyPacks', false);
    setStorageItemIfNull('gameVersion', 'kaimei_0613');
    // Display options
    setStorageItemIfNull('sranModeEnabled', false);
    setStorageItemIfNull('preferGenre', false);
    setStorageItemIfNull('showChartDetails', false);
    setStorageItemIfNull('displayStyle', "normal");
    setStorageItemIfNull('customLink1Url', '');

    this.setState({
      isDoneLoading: true,
      chartDisplayOptions: {
        sranModeEnabled: getStorageBoolean('sranModeEnabled'),
        preferGenre: getStorageBoolean('preferGenre'),
        showChartDetails: getStorageBoolean('showChartDetails'),
        displayStyle: parseChartDisplayStyle(getStorageString('displayStyle')),
        // Currently not configurable in the UI.
        assetsUrl: 'https://popn-assets.surge.sh',
        showLinks: false,
        customLink1Url: getStorageString('customLink1Url'),
      },
      chartDrawOptions: {
        count: getStorageNumber('count'),
        levelMin: getStorageNumber('levelMin'),
        levelMax: getStorageNumber('levelMax'),
        sranLevelMin: parseSranLevel(getStorageString('sranLevelMin', '01a')),
        sranLevelMax: parseSranLevel(getStorageString('sranLevelMax', '05')),
        includeDiffsRadio: getStorageString("includeDiffsRadio", "all") as "all" | "choose",
        includeDiffs: getStorageString("includeDiffs"),
        hardestDiff: parseIncludeOptionSafe(getStorageString("hardestDiff")),
        versionFoldersRadio: getStorageString("versionFoldersRadio", "all") as "all" | "choose",
        versionFolders: deserializeVersionFolders(getStorageString("versionFolders")),
        floorInfection: parseIncludeOptionSafe(getStorageString("floorInfection")),
        buggedBpms: parseIncludeOptionSafe(getStorageString("buggedBpms")),
        holdNotes: parseIncludeOptionSafe(getStorageString("holdNotes")),
      },
    });
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleUnload);
  }

  handleUnload = (event: BeforeUnloadEvent) => {
    const { chartDataSets } = this.state;
    if (chartDataSets.length) {
      event.returnValue = 'Are you sure you want to leave?';
    }
  };

  onControlPanelDraw = (querySampleOptions: ChartQuerySampleOptions) => {
    console.log(querySampleOptions);
    const newChartDataSet = Database.sampleQueriedCharts(querySampleOptions);

    this.setState((prevState) => ({
      chartDataSets: [newChartDataSet, ...prevState.chartDataSets],
    }));
  };

  onControlPanelClear = () => {
    this.setState({
      chartDataSets: [],
    });
  };

  onControlPanelChange = (newControlPanelState: Partial<ControlPanelState>) => {
    this.setState((prevState) => ({
      chartDisplayOptions: {
        ...prevState.chartDisplayOptions,
        ...newControlPanelState,
      },
    }));
    Object.entries(newControlPanelState).forEach(([key, value]) => {
      if (key === "versionFolders") {
        setStorageItem(key, serializeVersionFolders(value as boolean[]));
      } else {
        setStorageItem(key, value);
      }
    });
  };

  render() {
    const { isDoneLoading, chartDataSets, chartDrawOptions, chartDisplayOptions } = this.state;

    return (
      <section className="App">
        {isDoneLoading && (
          <>
            <ControlPanel
              extraClass={styles.controlPanel}
              initialDrawOptions={chartDrawOptions}
              initialDisplayOptions={chartDisplayOptions}
              onDraw={this.onControlPanelDraw}
              onClear={this.onControlPanelClear}
              onChange={this.onControlPanelChange}
            />
            <SetList
              extraClass={styles.setList}
              chartDataSets={chartDataSets}
              chartDisplayOptions={chartDisplayOptions}
            />
          </>
        )}
      </section>
    );
  }
}
