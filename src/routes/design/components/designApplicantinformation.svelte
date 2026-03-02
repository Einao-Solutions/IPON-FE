<script lang="ts">
  import { applicantDesignDescription } from '$lib/helpers';
  import Icon from '@iconify/svelte';
  import { Button } from '$lib/components/ui/button';
  import { designForm } from '$lib/utils/design';
  import { get, writable } from 'svelte/store';
  import { tick } from 'svelte';
  import * as Table from '$lib/components/ui/table';
  import * as Popover from '$lib/components/ui/popover';
  import * as Command from '$lib/components/ui/command';
  import { countriesMap } from '$lib/constants';
  import { cn } from '$lib/utils';
  import { Input } from '$lib/components/ui/input';
  import { countryDialingCodes } from '$lib/utils/patent';

  type ApplicantRow = {
    name: string;
    email: string;
    phone: string;
    phonePrefix: string;
    nationality: string;
    state: string;
    address: string;
  };

  let allApplicants = writable<ApplicantRow[]>(
    (get(designForm).applicants as ApplicantRow[])?.length
      ? (get(designForm).applicants as ApplicantRow[])
      : [
          {
            name: '',
            email: '',
            phone: '',
            phonePrefix: '',
            nationality: '',
            state: '',
            address: ''
          }
        ]
  );

  let listofValidatedApplicants = writable<
    {
      phone: boolean | null;
      nationality: boolean | null;
      email: boolean | null;
      address: boolean | null;
      name: boolean | null;
      state: boolean | null;
    }[]
  >([]);

  let listOfOpenCountries = writable<boolean[]>([]);
  let isEditing: boolean = true;
  let showResetButton: boolean = true;

  function addApplicant() {
    allApplicants.update((applicants) => [
      ...applicants,
      {
        name: '',
        email: '',
        phone: '',
        phonePrefix: '',
        nationality: '',
        state: '',
        address: ''
      }
    ]);
    listofValidatedApplicants.update((valid) => [
      ...valid,
      { phone: null, nationality: null, email: null, address: null, name: null, state: null }
    ]);
    listOfOpenCountries.update((countries) => [...countries, false]);
    isEditing = true;
  }

  function removeApplicant(index: number) {
    allApplicants.update((applicants) => {
      applicants.splice(index, 1);
      return [...applicants];
    });
    listOfOpenCountries.update((opener) => {
      opener.splice(index, 1);
      return [...opener];
    });
    listofValidatedApplicants.update((valid) => {
      valid.splice(index, 1);
      return [...valid];
    });
  }

  function UpdateApplicantField(field: keyof ApplicantRow, value: string, index: number) {
    allApplicants.update((applicants) => {
      const updated = { ...applicants[index] };
      (updated as any)[field] = value;
      if (field === 'nationality') {
        updated.phonePrefix = countryDialingCodes[value] ?? '';
        updated.phone = '';
      }
      applicants[index] = updated;
      return [...applicants];
    });
  }

  function EditorSave() {
    if (isEditing) {
      if (validate()) {
        isEditing = false;
        designForm.update((f) => ({ ...f, applicants: get(allApplicants) }));
      }
      return;
    }
    isEditing = !isEditing;
  }

  function validate(): boolean {
    const applicants = get(allApplicants);
    let listOfStatus: boolean[] = [];

    const validators =
      get(listofValidatedApplicants).length === applicants.length
        ? get(listofValidatedApplicants)
        : applicants.map(() => ({
            phone: null,
            nationality: null,
            email: null,
            address: null,
            name: null,
            state: null
          }));

    for (let i = 0; i < applicants.length; i++) {
      const a = applicants[i];
      validators[i].name = a.name.trim() !== '';
      validators[i].phone = a.phone.trim() !== '';
      validators[i].email = a.email.trim() !== '';
      validators[i].address = a.address.trim() !== '';
      validators[i].nationality = a.nationality.trim() !== '';
      validators[i].state = a.state.trim() !== '';

      listOfStatus.push(
        !!validators[i].name &&
          !!validators[i].phone &&
          !!validators[i].email &&
          !!validators[i].address &&
          !!validators[i].nationality &&
          !!validators[i].state
      );
    }

    listofValidatedApplicants.set(validators);
    return listOfStatus.every((x) => x === true) && applicants.length >= 1;
  }

  function GetCountryImageLink(country: string) {
    const map = countriesMap as Record<string, string>;
    const key = Object.keys(map).find((k) => map[k] === country);
    return key ? `https://flagcdn.com/20x15/${key}.png` : '';
  }

  function closeCountryAndFocusTrigger(triggerId: string, index: number) {
    const openers = get(listOfOpenCountries);
    openers[index] = false;
    listOfOpenCountries.set(openers);
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  function getInputValue(event: Event): string {
    const target = event.target as HTMLInputElement;
    return target.value ?? '';
  }
</script>

<div class="max-w-4xl mx-auto">
  <div class="rounded-lg shadow bg-white p-6 mb-6">
    <h2 class="text-2xl font-bold mb-6 text-green-700">Applicant Information</h2>
    <div class="rounded-md bg-accent h-20 pl-2 pr-2 text-center flex flex-col justify-center mb-4">
      {applicantDesignDescription}
    </div>
    <div class="flex justify-between items-center mb-4">
      <strong>List of Applicants</strong>
      <div class="flex gap-4">
        <Button
          variant="ghost"
          class="{showResetButton ? 'inline' : 'hidden'} text-blue-500"
          on:click={() => allApplicants.set([])}
        >
          reset
        </Button>
        {#if get(allApplicants).length !== 0}
          <Button variant="outline" on:click={() => EditorSave()}>{isEditing ? 'Save' : 'Edit'}</Button>
        {/if}
        <Button variant="default" on:click={() => addApplicant()}>
          <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
          Add Applicant
        </Button>
      </div>
    </div>
    <div class="text-xs text-gray-500 mb-4">(Allow more than one applicant)</div>
    <div class="rounded-md border overflow-y-auto h-[300px] flex-grow overflow-x-auto">
      <Table.Root>
        {#if get(allApplicants).length === 0}
          <p class="text-center justify-center text-xl flex flex-col h-[400px]">
            Enter at least one applicant
          </p>
        {:else}
          <Table.Header>
            <Table.Row>
              <Table.Head class="w-1">s/n</Table.Head>
              <Table.Head class="w-1"></Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Nationality</Table.Head>
              <Table.Head>Phone Number</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>State</Table.Head>
              <Table.Head>Address</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each get(allApplicants) as applicant, i (i)}
              <Table.Row>
                {#if isEditing}
                  <Table.Cell>{i + 1}</Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="outline"
                      size="icon"
                      style="color: darkred"
                      on:click={() => removeApplicant(i)}
                    >
                      <Icon icon="ei:minus" class="h-7 w-7" />
                    </Button>
                  </Table.Cell>
                  <Table.Cell class="min-w-40">
                    <Input
                      value={applicant.name}
                      on:input={(event) =>
                        UpdateApplicantField('name', getInputValue(event), i)}
                    />
                    {#if $listofValidatedApplicants[i]?.name !== true &&
                      $listofValidatedApplicants[i]?.name !== null}
                      <span style="color: darkred">name cannot be empty</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="flex flex-col">
                    <Popover.Root open={$listOfOpenCountries[i]} let:ids>
                      <Popover.Trigger asChild let:builder>
                        <Button
                          builders={[builder]}
                          variant="outline"
                          role="combobox"
                          aria-expanded={false}
                          class="w-[200px] justify-between"
                        >
                          <img
                            class={applicant.nationality !== '' ? 'block' : 'hidden'}
                            src={GetCountryImageLink(applicant.nationality)}
                            width="20"
                            height="15"
                            alt="@flag"
                          />
                          {applicant.nationality !== '' ? applicant.nationality : 'Select a country'}
                          <Icon
                            icon="ph:caret-up-down-thin"
                            width="1.2rem"
                            height="1.2rem"
                            class="opacity-50 shrink-0 ml-2"
                          />
                        </Button>
                      </Popover.Trigger>
                      <Popover.Content class="w-[250px] h-[250px] p-0 z-50">
                        <Command.Root>
                          <Command.Input placeholder="Search countries..." />
                          <Command.Empty>No countries found.</Command.Empty>
                          <Command.Group class="overflow-y-auto">
                            {#each Object.values(countriesMap) as country}
                              <Command.Item
                                value={country}
                                onSelect={(currentValue) => {
                                  UpdateApplicantField('nationality', currentValue, i);
                                  closeCountryAndFocusTrigger(ids.trigger, i);
                                }}
                              >
                                <Icon
                                  icon="basil:check-solid"
                                  class={cn(
                                    'mr-2 h-4 w-4',
                                    applicant.nationality !== country && 'text-transparent'
                                  )}
                                />
                                {country}
                              </Command.Item>
                            {/each}
                          </Command.Group>
                        </Command.Root>
                      </Popover.Content>
                    </Popover.Root>
                    {#if $listofValidatedApplicants[i]?.nationality !== true &&
                      $listofValidatedApplicants[i]?.nationality !== null}
                      <span style="color: darkred">select a country</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="min-w-40 flex items-center gap-2">
                    <Input
                      value={applicant.phonePrefix}
                      readonly
                      class="w-16 bg-gray-100 text-gray-700"
                    />
                    <Input
                      value={applicant.phone}
                      on:input={(event) =>
                        UpdateApplicantField('phone', getInputValue(event), i)}
                    />
                    {#if $listofValidatedApplicants[i]?.phone !== true &&
                      $listofValidatedApplicants[i]?.phone !== null}
                      <span style="color: red">enter phone number</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="min-w-40">
                    <Input
                      value={applicant.email}
                      on:input={(event) =>
                        UpdateApplicantField('email', getInputValue(event), i)}
                    />
                    {#if $listofValidatedApplicants[i]?.email !== true &&
                      $listofValidatedApplicants[i]?.email !== null}
                      <span style="color: red">enter email address</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="min-w-40">
                    <Input
                      value={applicant.state}
                      on:input={(event) =>
                        UpdateApplicantField('state', getInputValue(event), i)}
                    />
                    {#if $listofValidatedApplicants[i]?.state !== true &&
                      $listofValidatedApplicants[i]?.state !== null}
                      <span style="color: red">enter state</span>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="min-w-40">
                    <Input
                      value={applicant.address}
                      on:input={(event) =>
                        UpdateApplicantField('address', getInputValue(event), i)}
                    />
                    {#if $listofValidatedApplicants[i]?.address !== true &&
                      $listofValidatedApplicants[i]?.address !== null}
                      <span style="color: red">enter address</span>
                    {/if}
                  </Table.Cell>
                {:else}
                  <Table.Cell class="w-1">{i + 1}</Table.Cell>
                  <Table.Cell>
                    <Button
                      variant="outline"
                      size="icon"
                      style="color: darkred"
                      on:click={() => removeApplicant(i)}
                    >
                      <Icon icon="ei:minus" class="h-7 w-7" />
                    </Button>
                  </Table.Cell>
                  <Table.Cell class="min-w-52">{applicant.name}</Table.Cell>
                  <Table.Cell>
                    <span class="flex gap-2">
                      <img
                        src={GetCountryImageLink(applicant.nationality)}
                        width="20"
                        height="15"
                        alt="@flag"
                      />
                      {applicant.nationality}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{applicant.phonePrefix}{applicant.phone}</Table.Cell>
                  <Table.Cell>{applicant.email}</Table.Cell>
                  <Table.Cell>{applicant.state}</Table.Cell>
                  <Table.Cell class="min-w-60">{applicant.address}</Table.Cell>
                {/if}
              </Table.Row>
            {/each}
          </Table.Body>
        {/if}
      </Table.Root>
    </div>
  </div>
</div>
